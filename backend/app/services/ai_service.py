from __future__ import annotations

import logging
import os
import re
import json

from groq import Groq

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "Disclaimer: I can only provide general information and cannot diagnose conditions. "
    "Please consult a qualified doctor for medical advice, diagnosis, or treatment."
)

SYSTEM_PROMPT = (
    "You are a medical assistant focused on general cancer-related health information. "
    "Do not provide diagnosis, definitive conclusions, or treatment prescriptions. "
    "If symptoms seem concerning, advise seeing a doctor. "
    "Use simple language and avoid technical jargon."
)


class AIService:
    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
        self._client: Groq | None = None
        self._configured = False

    def _configure(self) -> None:
        if self._configured or not self.api_key:
            return
        self._client = Groq(api_key=self.api_key)
        self._configured = True

    def generate_response(self, user_input: str) -> str:
        normalized_input = user_input.strip()
        if not normalized_input:
            return (
                "Please share your symptoms or concerns in a bit more detail so I can provide general guidance.\n\n"
                + DISCLAIMER
            )

        if not self.api_key:
            return f"{self._rule_based_fallback(normalized_input)}\n\n{DISCLAIMER}"

        try:
            self._configure()
            if self._client is None:
                raise RuntimeError("Groq client is not configured.")

            completion = self._client.chat.completions.create(
                model=self.model_name,
                temperature=0.4,
                max_tokens=220,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"User query: {normalized_input}\n"
                            "Return a short and clear answer in under 120 words."
                        ),
                    },
                ],
            )

            content = (completion.choices[0].message.content or "").strip()
            if not content:
                content = "I am unable to generate a response right now. Please try again in a moment."
        except Exception as exc:
            logger.error(f"Groq API failed: {type(exc).__name__}: {exc}")
            content = self._rule_based_fallback(normalized_input)

        if "disclaimer" not in content.lower():
            content = f"{content}\n\n{DISCLAIMER}"

        return content

    def generate_report_summary(self, extracted_text: str) -> str:
        normalized_text = extracted_text.strip()
        if not normalized_text:
            return "No report text was provided for summarization."

        if not self.api_key:
            return self._fallback_report_summary(normalized_text)

        try:
            self._configure()
            if self._client is None:
                raise RuntimeError("Groq client is not configured.")

            completion = self._client.chat.completions.create(
                model=self.model_name,
                temperature=0.3,
                max_tokens=260,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "You are a medical assistant.\n\n"
                            "Carefully analyze the FULL medical report below.\n\n"
                            "You MUST:\n"
                            "1. Identify ALL values and compare them with their reference ranges\n"
                            "2. Clearly list abnormal values (high or low) in a separate section\n"
                            "3. Do NOT skip any section like WBC, platelets, or differential count\n"
                            "4. Provide a simple explanation in plain English\n\n"
                            "Strict rules:\n"
                            "- Do NOT say 'no abnormalities' unless you are 100% sure\n"
                            "- Do NOT ignore any part of the report\n"
                            "- You MUST mention WBC, lymphocytes, and platelet-related values if present\n"
                            "- Always include 3 sections: Key Findings, Abnormal Values, Simple Explanation\n"
                            "- If any value is even slightly outside the range, include it in abnormal values.\n\n"
                            f"Medical Report:\n{normalized_text[:12000]}"
                        ),
                    },
                ],
            )

            content = (completion.choices[0].message.content or "").strip()
            if not content:
                content = self._fallback_report_summary(normalized_text)
            return self._enforce_report_sections(content)
        except Exception as exc:
            logger.error(f"Groq report summary failed: {type(exc).__name__}: {exc}")
            return self._enforce_report_sections(self._fallback_report_summary(normalized_text))

    def generate_structured_report_summary(self, structured_data: dict) -> str:
        normalized_structured_data = {
            key: (value.model_dump() if hasattr(value, "model_dump") else value)
            for key, value in structured_data.items()
        }

        if not normalized_structured_data:
            return self._enforce_report_sections(
                "Key Findings:\n- No structured medical parameters were detected.\n\n"
                "Abnormal Values:\n- No abnormal values could be identified from the provided data.\n\n"
                "Simple Explanation:\n- The report format could not be parsed reliably, so please review this report with a clinician."
            )

        payload = json.dumps(normalized_structured_data, ensure_ascii=True, indent=2)

        if not self.api_key:
            return self._enforce_report_sections(
                self._fallback_structured_summary(normalized_structured_data),
                normalized_structured_data,
            )

        try:
            self._configure()
            if self._client is None:
                raise RuntimeError("Groq client is not configured.")

            completion = self._client.chat.completions.create(
                model=self.model_name,
                temperature=0.2,
                max_tokens=320,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "You are a medical assistant.\n\n"
                            "You will be given structured medical data in JSON format where each parameter already includes its value, normal range, and status (high/low/normal).\n\n"
                            "Your job is to:\n\n"
                            "1. Provide Key Findings:\n"
                            "- Summarize overall condition based on the data\n"
                            "- Mention if most values are normal\n\n"
                            "2. List Abnormal Values:\n"
                            "- ONLY include parameters where status is 'high' or 'low'\n"
                            "- Mention value and whether it is high or low\n\n"
                            "3. Provide Simple Explanation:\n"
                            "- Explain what these abnormalities could indicate in plain English\n"
                            "- Keep it simple and non-technical\n\n"
                            "Strict Rules:\n"
                            "- DO NOT recalculate or guess values\n"
                            "- DO NOT contradict the given status\n"
                            "- DO NOT introduce parameters not present in input\n"
                            "- DO NOT hallucinate values like cholesterol if not provided\n"
                            "- Be concise and structured\n\n"
                            "Always include 3 sections: Key Findings, Abnormal Values, Simple Explanation.\n\n"
                            f"Data:\n{payload}"
                        ),
                    },
                ],
            )

            content = (completion.choices[0].message.content or "").strip()
            if not content:
                content = self._fallback_structured_summary(normalized_structured_data)
            return self._enforce_report_sections(content, normalized_structured_data)
        except Exception as exc:
            logger.error(f"Groq structured report summary failed: {type(exc).__name__}: {exc}")
            return self._enforce_report_sections(
                self._fallback_structured_summary(normalized_structured_data),
                normalized_structured_data,
            )

    def generate_report_chat_response(self, report_text: str, question: str, structured_data: dict | None = None) -> str:
        normalized_report = report_text.strip()
        normalized_question = question.strip()
        if not normalized_question:
            return "Please ask a question about your report so I can help explain it.\n\n" + DISCLAIMER

        if not self.api_key:
            return self._rule_based_fallback(normalized_question) + "\n\n" + DISCLAIMER

        try:
            self._configure()
            if self._client is None:
                raise RuntimeError("Groq client is not configured.")

            normalized_structured_data = None
            if structured_data:
                normalized_structured_data = {
                    key: (value.model_dump() if hasattr(value, "model_dump") else value)
                    for key, value in structured_data.items()
                }

            abnormal_payload = {}
            if normalized_structured_data:
                abnormal_payload = {
                    key: value
                    for key, value in normalized_structured_data.items()
                    if str(value.get("status", "")).lower() in {"high", "low"}
                }

            completion = self._client.chat.completions.create(
                model=self.model_name,
                temperature=0.2,
                max_tokens=220,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "You are answering follow-up questions about a medical report.\n\n"
                            "Answer the user's question directly first.\n"
                            "Do not restate the full report unless the user explicitly asks for a full summary.\n"
                            "Use at most 4 concise bullet points and keep the response under 120 words.\n"
                            "If the user asks seriousness/risk, provide: risk level (low/moderate/high), top reasons, and next step.\n"
                            "Do not add values that are not in the provided data.\n\n"
                            f"User question: {normalized_question}\n\n"
                            f"Abnormal parameters JSON (preferred context): {json.dumps(abnormal_payload, ensure_ascii=True)}\n\n"
                            f"Full report text (fallback context): {normalized_report[:3000]}"
                        ),
                    },
                ],
            )

            content = (completion.choices[0].message.content or "").strip()
            if not content:
                content = "I am unable to explain that right now. Please try again in a moment."
        except Exception as exc:
            logger.error(f"Groq report chat failed: {type(exc).__name__}: {exc}")
            content = self._rule_based_fallback(normalized_question)

        if "disclaimer" not in content.lower():
            content = f"{content}\n\n{DISCLAIMER}"

        return content

    def _rule_based_fallback(self, user_input: str) -> str:
        text = user_input.lower()
        emergency_terms = {"chest pain", "breathing", "seizure", "fainting", "vomiting blood"}
        warning_terms = {"weight loss", "bleeding", "blood", "lump", "persistent", "fatigue", "fever"}

        if any(term in text for term in emergency_terms):
            return (
                "Your symptoms could be urgent. Please seek immediate in-person medical care or emergency help now. "
                "Do not delay evaluation."
            )

        if any(term in text for term in warning_terms):
            return (
                "These symptoms can have many causes and should be checked by a doctor, especially if they persist or worsen. "
                "Track when symptoms started, what makes them better or worse, and share this with your clinician."
            )

        return (
            "I can provide general health information based on your symptoms. Monitor symptom duration and intensity, "
            "stay hydrated, and arrange a medical visit if symptoms continue or concern you."
        )

    def _fallback_report_summary(self, extracted_text: str) -> str:
        preview = extracted_text[:800]
        return (
            "Key Findings:\n"
            "- Automated fallback summary was used because AI analysis is temporarily unavailable.\n\n"
            "Abnormal Values:\n"
            "- Specific abnormal values could not be extracted in fallback mode.\n\n"
            "Simple Explanation:\n"
            "- This report needs clinician review for an accurate interpretation.\n"
            f"- Report preview: {preview}"
        )

    def _fallback_structured_summary(self, structured_data: dict) -> str:
        total = len(structured_data)
        abnormal = [
            (name, values)
            for name, values in structured_data.items()
            if str(values.get("status", "")).lower() in {"high", "low"}
        ]

        key_lines = [f"- Parameters analyzed: {total}."]
        if abnormal:
            key_lines.append(f"- Abnormal parameters detected: {len(abnormal)}.")
        else:
            key_lines.append("- Most available values are within normal range.")

        abnormal_lines = []
        for name, values in abnormal:
            abnormal_lines.append(
                f"- {name}: {values.get('value')} ({values.get('status')})"
            )
        if not abnormal_lines:
            abnormal_lines.append("- No parameters are marked high or low in the provided structured data.")

        abnormal_names = [name for name, _ in abnormal]
        if abnormal_names:
            simple_lines = [
                f"- The main out-of-range results are: {', '.join(abnormal_names)}.",
                "- These changes can be clinically significant depending on symptoms and history, so discuss them with your doctor.",
            ]
        else:
            simple_lines = [
                "- Most measured values are within their reference ranges in the provided data.",
                "- Continue routine follow-up with your doctor for full clinical context.",
            ]

        return (
            "Key Findings:\n"
            + "\n".join(key_lines)
            + "\n\nAbnormal Values:\n"
            + "\n".join(abnormal_lines)
            + "\n\nSimple Explanation:\n"
            + "\n".join(simple_lines)
        )

    def _enforce_report_sections(self, content: str, structured_data: dict | None = None) -> str:
        sections = self._split_summary_sections(content)
        key_text = "\n".join(sections["key"])
        abnormal_text = "\n".join(sections["abnormal"])
        simple_text = "\n".join(sections["simple"])

        if not key_text:
            key_text = content.strip()

        if not abnormal_text:
            abnormal_candidates = []
            for line in content.splitlines():
                normalized = line.strip().lower()
                if any(token in normalized for token in ["high", "low", "abnormal", "outside", "elevated"]):
                    abnormal_candidates.append(line.strip())
            abnormal_text = "\n".join(abnormal_candidates) or "No explicit abnormal values were listed in the generated summary."

        if not simple_text:
            simple_text = self._build_dynamic_simple_explanation(abnormal_text, structured_data)

        key_bullets = self._to_bullets(key_text)
        abnormal_bullets = self._to_bullets(abnormal_text)
        simple_bullets = self._to_bullets(simple_text)

        return (
            "Key Findings:\n"
            + "\n".join(f"- {line}" for line in key_bullets)
            + "\n\nAbnormal Values:\n"
            + "\n".join(f"- {line}" for line in abnormal_bullets)
            + "\n\nSimple Explanation:\n"
            + "\n".join(f"- {line}" for line in simple_bullets)
        )

    def _build_dynamic_simple_explanation(self, abnormal_text: str, structured_data: dict | None) -> str:
        if structured_data:
            highs = [name for name, values in structured_data.items() if str(values.get("status", "")).lower() == "high"]
            lows = [name for name, values in structured_data.items() if str(values.get("status", "")).lower() == "low"]

            lines: list[str] = []
            if highs:
                lines.append(f"The following values are above range: {', '.join(sorted(highs))}.")
            if lows:
                lines.append(f"The following values are below range: {', '.join(sorted(lows))}.")
            if not highs and not lows:
                lines.append("Most measured values are within reference range in the available data.")
            lines.append("Please review these findings with your doctor, who can interpret them with your symptoms and medical history.")
            return "\n".join(lines)

        abnormal_lines = [line.strip("- ").strip() for line in abnormal_text.splitlines() if line.strip()]
        if abnormal_lines:
            return (
                "Some values are outside the reference range in this report.\n"
                "This can indicate inflammation, deficiency, or other conditions depending on your history.\n"
                "Please review these findings with your doctor for a confirmed interpretation."
            )
        return (
            "Most values look within range based on the available report text.\n"
            "Please still review the full report with your doctor for clinical confirmation."
        )

    def _split_summary_sections(self, content: str) -> dict[str, list[str]]:
        sections: dict[str, list[str]] = {"key": [], "abnormal": [], "simple": []}
        current: str | None = None

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line:
                continue

            normalized = line.strip("* ")
            normalized = re.sub(r"^\\d+[\\).:-]?\\s*", "", normalized).strip().lower()

            if "key findings" in normalized or normalized in {"findings", "findings:"}:
                current = "key"
                continue
            if "abnormal values" in normalized or "abnormalities" in normalized:
                current = "abnormal"
                continue
            if (
                "simple explanation" in normalized
                or normalized.startswith("explanation")
                or "what this means" in normalized
                or "plain english" in normalized
                or "interpretation" in normalized
            ):
                current = "simple"
                continue

            if current is None:
                sections["key"].append(line)
            else:
                sections[current].append(line)

        return sections

    def _to_bullets(self, text: str) -> list[str]:
        candidates: list[str] = []
        for raw_line in text.splitlines():
            line = raw_line.strip().strip("* ")
            if not line:
                continue
            if re.search(r"(?i)^(key findings|findings|abnormal values|abnormalities|simple explanation|explanation)\s*:?", line):
                continue
            line = re.sub(r"^\\d+[\\).:-]?\\s*", "", line).strip()
            candidates.append(line)

        if not candidates:
            return ["No additional details available."]

        if len(candidates) == 1 and len(candidates[0]) > 180:
            chunks = [part.strip() for part in re.split(r"[.;]\s+", candidates[0]) if part.strip()]
            return chunks[:4] or candidates

        return candidates[:6]


ai_service = AIService()

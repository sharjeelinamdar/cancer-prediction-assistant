from __future__ import annotations

from dataclasses import dataclass
import re

from app.schemas.report import StructuredParameter, StructuredParameterInput


@dataclass(frozen=True)
class ParameterSpec:
    aliases: tuple[str, ...]
    plausible_min: float
    plausible_max: float


PARAMETER_SPECS: dict[str, ParameterSpec] = {
    "hemoglobin": ParameterSpec(("hemoglobin",), 2.0, 25.0),
    "rbc": ParameterSpec(("rbc count", "rbc"), 1.0, 10.0),
    "wbc": ParameterSpec(("wbc count", "total wbc", "wbc"), 500.0, 100000.0),
    "hematocrit": ParameterSpec(("hematocrit",), 5.0, 75.0),
    "mcv": ParameterSpec(("mcv",), 30.0, 130.0),
    "mch": ParameterSpec(("mch",), 10.0, 45.0),
    "mchc": ParameterSpec(("mchc",), 20.0, 45.0),
    "rdw": ParameterSpec(("rdw", "rdw cv"), 5.0, 30.0),
    "platelets": ParameterSpec(("platelet count", "platelets", "platelet"), 1000.0, 2000000.0),
    "mpv": ParameterSpec(("mpv",), 2.0, 30.0),
    "neutrophils": ParameterSpec(("neutrophils",), 0.0, 100.0),
    "lymphocytes": ParameterSpec(("lymphocytes",), 0.0, 100.0),
    "eosinophils": ParameterSpec(("eosinophils",), 0.0, 100.0),
    "monocytes": ParameterSpec(("monocytes",), 0.0, 100.0),
    "basophils": ParameterSpec(("basophils",), 0.0, 100.0),
    "cholesterol": ParameterSpec(("cholesterol", "total cholesterol"), 30.0, 800.0),
    "triglycerides": ParameterSpec(("triglycerides", "triglyceride"), 10.0, 3000.0),
    "hba1c": ParameterSpec(("hba1c", "hb a1c", "glycated hemoglobin"), 2.0, 20.0),
    "vitamin_d": ParameterSpec(("vitamin d", "25-oh vitamin d", "25 oh vitamin d"), 1.0, 250.0),
    "vitamin_b12": ParameterSpec(("vitamin b12", "b12"), 10.0, 4000.0),
    "psa": ParameterSpec(("psa", "prostate specific antigen"), 0.0, 200.0),
}

RANGE_PATTERN = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)(?!\d)", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)(?!\d)")


def _compute_status(value: float, minimum: float, maximum: float) -> str:
    if value < minimum:
        return "low"
    if value > maximum:
        return "high"
    return "normal"


def _build_parameter(value: float, minimum: float, maximum: float, confidence: str) -> StructuredParameter:
    return StructuredParameter(
        value=float(value),
        range=(float(minimum), float(maximum)),
        status=_compute_status(float(value), float(minimum), float(maximum)),
        confidence=confidence,
    )


def _normalize_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()


def _line_mentions_alias(line: str, aliases: tuple[str, ...]) -> bool:
    lowered = line.lower()
    for alias in aliases:
        if re.search(rf"\b{re.escape(alias.lower())}\b", lowered):
            return True
    return False


def _line_confidence(range_found: bool, in_or_near_range: bool) -> str:
    if range_found and in_or_near_range:
        return "high"
    if range_found:
        return "medium"
    return "low"


def _extract_line_candidate(line: str, spec: ParameterSpec) -> tuple[float, float, float, str] | None:
    range_match = RANGE_PATTERN.search(line)
    if not range_match:
        return None

    min_value = float(range_match.group(1))
    max_value = float(range_match.group(2))
    if min_value > max_value:
        min_value, max_value = max_value, min_value

    numbers = [(float(match.group(1)), match.start(), match.end()) for match in NUMBER_PATTERN.finditer(line)]
    candidates: list[tuple[float, int, float]] = []

    for value, start, end in numbers:
        if start >= range_match.start() and end <= range_match.end():
            continue

        if value < spec.plausible_min or value > spec.plausible_max:
            continue

        if max_value > 0 and (value > max_value * 100 or value < min_value / 100):
            continue

        score = 0.0
        if start > range_match.end():
            score += 3.0
        if min_value <= value <= max_value:
            score += 3.0
        elif value < min_value:
            score += max(0.0, 2.0 - ((min_value - value) / max(min_value, 1.0)) * 4.0)
        else:
            score += max(0.0, 2.0 - ((value - max_value) / max(max_value, 1.0)) * 4.0)
        score += min(start / 200.0, 2.0)

        candidates.append((value, start, score))

    if not candidates:
        return None

    chosen_value, _, _ = sorted(candidates, key=lambda item: item[2], reverse=True)[0]
    in_or_near = (min_value * 0.8) <= chosen_value <= (max_value * 1.2)
    confidence = _line_confidence(range_found=True, in_or_near_range=in_or_near)
    return chosen_value, min_value, max_value, confidence


def _extract_from_text(extracted_text: str) -> dict[str, StructuredParameter]:
    lines = [_normalize_line(line) for line in extracted_text.split("\n")]
    lines = [line for line in lines if line]

    structured: dict[str, StructuredParameter] = {}

    for param_name, spec in PARAMETER_SPECS.items():
        candidates: list[tuple[float, float, float, str, float]] = []

        for line in lines:
            if not _line_mentions_alias(line, spec.aliases):
                continue

            extracted = _extract_line_candidate(line, spec)
            if not extracted:
                continue

            value, minimum, maximum, confidence = extracted
            reason_score = 0.0
            if minimum <= value <= maximum:
                reason_score = 2.0
            elif value < minimum:
                reason_score = max(0.0, 1.5 - (minimum - value) / max(minimum, 1.0))
            else:
                reason_score = max(0.0, 1.5 - (value - maximum) / max(maximum, 1.0))

            if confidence == "high":
                reason_score += 1.0
            elif confidence == "medium":
                reason_score += 0.5

            candidates.append((value, minimum, maximum, confidence, reason_score))

        if not candidates:
            continue

        chosen = sorted(candidates, key=lambda item: item[4], reverse=True)[0]
        structured[param_name] = _build_parameter(chosen[0], chosen[1], chosen[2], chosen[3])

    return structured


def _extract_from_structured_input(
    structured_input: dict[str, StructuredParameterInput],
) -> dict[str, StructuredParameter]:
    normalized: dict[str, StructuredParameter] = {}
    for key, param in structured_input.items():
        minimum, maximum = param.range
        normalized[key.lower().strip()] = _build_parameter(param.value, minimum, maximum, "high")
    return normalized


def build_structured_report(
    extracted_text: str | None,
    structured_input: dict[str, StructuredParameterInput] | None,
) -> dict[str, StructuredParameter]:
    if structured_input:
        return _extract_from_structured_input(structured_input)
    return _extract_from_text((extracted_text or "").strip())

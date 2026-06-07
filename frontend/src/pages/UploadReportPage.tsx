import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import ChatBubble from "../components/ChatBubble";
import FileDropzone from "../components/FileDropzone";
import { analyzeReport, sendReportChatMessage, uploadReport } from "../lib/api";
import type { StructuredParameter } from "../lib/api";
import {
  appendReportHistory,
  DASHBOARD_STORAGE_KEY,
  SELECTED_REPORT_STORAGE_KEY,
  type ReportHistoryItem,
} from "../lib/reportHistory";

type ReportMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type ParsedSummary = {
  keyFindings: string[];
  abnormalValues: string[];
  simpleExplanation: string[];
};

const PROCESSING_STEPS = [
  "Extracting text from report...",
  "Structuring medical data...",
  "Analyzing parameters...",
  "Generating AI insights...",
];

const SUGGESTIONS = ["Explain abnormalities", "Is this serious?", "What should I do next?"];

const HIGHLIGHT_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  low: "bg-amber-100 text-amber-700",
  elevated: "bg-red-100 text-red-700",
  abnormal: "bg-amber-100 text-amber-700",
  wbc: "bg-sky-100 text-sky-700",
  platelets: "bg-sky-100 text-sky-700",
  hemoglobin: "bg-sky-100 text-sky-700",
  mpv: "bg-sky-100 text-sky-700",
};

const HIGHLIGHT_TERMS = Object.keys(HIGHLIGHT_STYLE);
const NUMERIC_PATTERN = /\b\d+(?:\.\d+)?\b/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseSummarySections(summary: string): ParsedSummary {
  const sections: ParsedSummary = {
    keyFindings: [],
    abnormalValues: [],
    simpleExplanation: [],
  };

  const lines = summary.split("\n").map((line) => line.trim()).filter(Boolean);
  let current: keyof ParsedSummary = "keyFindings";

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*]\s*/, "").trim();
    const normalized = line.toLowerCase().replace(/[:*]/g, "").trim();

    if (normalized.includes("key findings") || normalized === "findings") {
      current = "keyFindings";
      continue;
    }
    if (normalized.includes("abnormal values") || normalized.includes("abnormalities")) {
      current = "abnormalValues";
      continue;
    }
    if (normalized.includes("simple explanation") || normalized === "explanation") {
      current = "simpleExplanation";
      continue;
    }

    sections[current].push(line);
  }

  if (sections.keyFindings.length === 0 && lines.length > 0) {
    sections.keyFindings = lines.slice(0, 3);
  }
  if (sections.abnormalValues.length === 0) {
    sections.abnormalValues = ["No explicit abnormal values were listed in this summary."];
  }
  if (sections.simpleExplanation.length === 0) {
    sections.simpleExplanation = ["Please review this report with a qualified doctor."];
  }

  return sections;
}

function getRiskTheme(risk: "Low" | "Moderate" | "High" | "") {
  if (risk === "High") {
    return {
      badge: "text-red-700 bg-red-100 border-red-200",
      gradient: "from-red-50 via-red-100 to-rose-100",
      chip: "bg-red-100 text-red-700 border-red-200",
      pulse: "risk-pulse",
    };
  }
  if (risk === "Moderate") {
    return {
      badge: "text-amber-700 bg-amber-100 border-amber-200",
      gradient: "from-amber-50 via-yellow-100 to-amber-100",
      chip: "bg-amber-100 text-amber-700 border-amber-200",
      pulse: "",
    };
  }
  return {
    badge: "text-emerald-700 bg-emerald-100 border-emerald-200",
    gradient: "from-emerald-50 via-emerald-100 to-teal-100",
    chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pulse: "",
  };
}

function computeConfidenceLabel(structuredData: Record<string, StructuredParameter>): "High" | "Medium" | "Low" | "N/A" {
  const values = Object.values(structuredData);
  if (values.length === 0) {
    return "N/A";
  }
  const score = values.reduce((acc, param) => {
    if (param.confidence === "high") return acc + 2;
    if (param.confidence === "medium") return acc + 1;
    return acc;
  }, 0);
  const ratio = score / (values.length * 2);
  if (ratio >= 0.75) return "High";
  if (ratio >= 0.45) return "Medium";
  return "Low";
}

function HighlightedReportText({ text }: { text: string }) {
  const termRegex = useMemo(() => {
    const pattern = HIGHLIGHT_TERMS.map((term) => escapeRegExp(term)).join("|");
    return new RegExp(`(${pattern})`, "gi");
  }, []);

  const lines = useMemo(() => text.split("\n"), [text]);

  return (
    <>
      {lines.map((line, lineIndex) => {
        const pieces = line.split(termRegex);
        return (
          <p key={`line-${lineIndex}`} className="mb-2 leading-7 last:mb-0">
            {pieces.map((piece, pieceIndex) => {
              const normalized = piece.toLowerCase();
              const highlight = HIGHLIGHT_STYLE[normalized];
              if (highlight) {
                return (
                  <mark
                    key={`term-${lineIndex}-${pieceIndex}`}
                    className={`rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wide ${highlight}`}
                  >
                    {piece}
                  </mark>
                );
              }

              const numberParts = piece.split(NUMERIC_PATTERN);
              const numbers = piece.match(NUMERIC_PATTERN) ?? [];
              if (numbers.length === 0) {
                return <span key={`txt-${lineIndex}-${pieceIndex}`}>{piece}</span>;
              }

              return (
                <span key={`num-wrap-${lineIndex}-${pieceIndex}`}>
                  {numberParts.map((part, idx) => (
                    <span key={`seg-${lineIndex}-${pieceIndex}-${idx}`}>
                      {part}
                      {numbers[idx] ? <span className="font-semibold text-slate-900">{numbers[idx]}</span> : null}
                    </span>
                  ))}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

function ProcessingModal({ show, step }: { show: boolean; step: string }) {
  if (!show) {
    return null;
  }

  return (
    <div className="processing-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="processing-card w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm font-semibold text-slate-700">AI Processing Pipeline</p>
        </div>
        <p className="text-lg font-semibold text-slate-900">{step}</p>
        <p className="mt-2 text-sm text-slate-500">Please wait while we process your report with OCR and AI analysis.</p>
      </div>
    </div>
  );
}

export default function UploadReportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [processingVisible, setProcessingVisible] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Moderate" | "High" | "">("");
  const [riskReasons, setRiskReasons] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [savedFilePath, setSavedFilePath] = useState("");
  const [structuredData, setStructuredData] = useState<Record<string, StructuredParameter>>({});
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ReportMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Upload and analyze a report, then ask me questions about it in simple language.",
    },
  ]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const parsedSummary = useMemo(() => parseSummarySections(summary), [summary]);

  const abnormalChips = useMemo(() => {
    return Object.entries(structuredData)
      .filter(([, param]) => param.status === "high" || param.status === "low")
      .map(([name, param]) => `${param.status === "high" ? "High" : "Low"} ${toTitleCase(name)}`);
  }, [structuredData]);

  const confidenceLabel = useMemo(() => computeConfidenceLabel(structuredData), [structuredData]);

  const flowStage = useMemo(() => {
    if (summary) return 5;
    if (analyzing) return 4;
    if (extractedText) return 3;
    if (uploading) return 2;
    if (file) return 1;
    return 0;
  }, [analyzing, extractedText, file, summary, uploading]);

  const riskTheme = getRiskTheme(riskLevel || "Low");

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLoading, messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_REPORT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const selected = JSON.parse(raw) as ReportHistoryItem;

      setSummary(selected.summary || "");
      setRiskLevel(selected.riskLevel || "");
      setRiskReasons(selected.riskReasons || []);
      setKeywords(selected.highlightedKeywords || []);
      setExtractedText(selected.extractedText || "");
      setStructuredData(selected.structuredData || {});
      setSavedFilePath(selected.savedFilePath || "");

      setMessages([
        {
          id: 1,
          role: "assistant",
          text: "Loaded selected report context. Ask me anything about this report.",
        },
      ]);

      localStorage.removeItem(SELECTED_REPORT_STORAGE_KEY);
    } catch {
      localStorage.removeItem(SELECTED_REPORT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!processingVisible) {
      return;
    }
    const interval = setInterval(() => {
      setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [processingVisible]);

  const runWithProcessingModal = async (work: () => Promise<void>) => {
    const start = Date.now();
    setProcessingVisible(true);
    setProcessingStepIndex(0);

    try {
      await work();
    } finally {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, 5000 - elapsed);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      setProcessingVisible(false);
      setProcessingStepIndex(0);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) {
      return;
    }

    setUploading(true);
    setError("");
    setExtractedText("");
    setSummary("");
    setRiskLevel("");
    setRiskReasons([]);
    setKeywords([]);
    setSavedFilePath("");
    setStructuredData({});
    setMessages([
      {
        id: 1,
        role: "assistant",
        text: "Upload and analyze a report, then ask me questions about it in simple language.",
      },
    ]);

    try {
      await runWithProcessingModal(async () => {
        const result = await uploadReport(file);
        setExtractedText(result.extracted_text);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (!extractedText.trim() || analyzing) {
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      await runWithProcessingModal(async () => {
        const result = await analyzeReport(extractedText);
        setSummary(result.summary);
        setRiskLevel(result.risk_level);
        setRiskReasons(result.risk_reasons);
        setKeywords(result.highlighted_keywords);
        const analysisStructuredData = result.structured_data ?? {};
        setStructuredData(analysisStructuredData);
        setSavedFilePath(result.saved_file ?? "");

        const insights = Object.entries(analysisStructuredData)
          .filter(([, param]) => param.status === "high" || param.status === "low")
          .map(([name, param]) => `${param.status === "high" ? "High" : "Low"} ${toTitleCase(name)}`);

        localStorage.setItem(
          DASHBOARD_STORAGE_KEY,
          JSON.stringify({
            updatedAt: new Date().toISOString(),
            summary: result.summary,
            riskLevel: result.risk_level,
            riskReasons: result.risk_reasons,
            insights,
            confidence: computeConfidenceLabel(analysisStructuredData),
          })
        );

        appendReportHistory({
          id: `report-${Date.now()}`,
          name: file?.name || `Report ${new Date().toLocaleDateString()}`,
          uploadedAt: new Date().toISOString(),
          riskLevel: result.risk_level,
          riskReasons: result.risk_reasons,
          confidence: computeConfidenceLabel(analysisStructuredData),
          insights,
          summary: result.summary,
          highlightedKeywords: result.highlighted_keywords,
          extractedText,
          structuredData: analysisStructuredData,
          savedFilePath: result.saved_file,
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to analyze report.";
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReportChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || chatLoading || !extractedText.trim()) {
      return;
    }

    setChatLoading(true);
    setError("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: question }]);
    setChatInput("");

    try {
      const structuredPayload = Object.fromEntries(
        Object.entries(structuredData).map(([key, param]) => [
          key,
          {
            value: param.value,
            range: param.range,
            status: param.status,
          },
        ])
      );

      const result = await sendReportChatMessage(extractedText, question, structuredPayload);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: result.response }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send report question.";
      setError(message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <ProcessingModal show={processingVisible} step={PROCESSING_STEPS[processingStepIndex]} />

      <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">AI Medical Report Interpreter</h1>
        <p className="mt-2 text-sm text-slate-600">
          A structured pipeline to upload, extract, validate, analyze, and explain your report using AI.
        </p>
      </div>

      <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          {["Upload", "Extract", "Structure", "Analyze", "Explain"].map((step, idx) => {
            const active = flowStage >= idx + 1;
            return (
              <div
                key={step}
                className={[
                  "rounded-xl border px-3 py-2 text-center text-xs font-semibold transition",
                  active
                    ? "border-brand-200 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-slate-50 text-slate-500",
                ].join(" ")}
              >
                {idx + 1}. {step}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Upload Report</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">PDF / Image</span>
            </div>

            <div className="transition-transform duration-200 hover:scale-[1.01]">
              <FileDropzone onFileSelected={setFile} disabled={uploading || analyzing} />
            </div>

            {file && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p>
                  Selected file: <span className="font-semibold">{file.name}</span>
                </p>
                <p className="text-xs text-slate-500">{Math.ceil(file.size / 1024)} KB</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading || analyzing}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {uploading ? "Extracting..." : "Upload and Extract"}
              </button>
              <button
                type="button"
                onClick={handleSummarize}
                disabled={!extractedText.trim() || uploading || analyzing}
                className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:scale-[1.02] hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {analyzing ? "Analyzing report..." : "Summarize with AI"}
              </button>
            </div>
          </div>

          <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Extracted Text</h2>
              {keywords.length > 0 ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {keywords.length} highlights
                </span>
              ) : null}
            </div>

            <div className="max-h-[560px] min-h-[340px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-700">
              {extractedText ? (
                <HighlightedReportText text={extractedText} />
              ) : (
                <p className="text-slate-500">Extracted report content will appear here with keyword highlighting.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-7">
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">AI Summary</h2>
              {savedFilePath ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">JSON saved</span>
              ) : null}
            </div>

            {abnormalChips.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {abnormalChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 fade-in-up">
                <h3 className="mb-2 text-sm font-semibold text-sky-800">Key Findings</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {parsedSummary.keyFindings.map((item, idx) => (
                    <li key={`kf-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 fade-in-up">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">Abnormal Values</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {parsedSummary.abnormalValues.map((item, idx) => (
                    <li key={`ab-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 fade-in-up">
                <h3 className="mb-2 text-sm font-semibold text-emerald-800">Simple Explanation</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {parsedSummary.simpleExplanation.map((item, idx) => (
                    <li key={`se-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            </div>

            <div className={`fade-in-up rounded-2xl border border-slate-200 bg-gradient-to-br ${riskTheme.gradient} p-5 shadow-sm`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Risk Indicator</h2>
              <span className={`rounded-full border px-4 py-1 text-sm font-bold ${riskTheme.badge} ${riskLevel === "High" ? riskTheme.pulse : ""}`}>
                {riskLevel || "Not Analyzed"}
              </span>
            </div>

            <div className="mb-3 text-sm text-slate-700">
              <p className="font-semibold">Detected Issues</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {riskReasons.length > 0 ? riskReasons.map((reason, idx) => <li key={`rr-${idx}`}>{reason}</li>) : <li>Run analysis to view detected issues.</li>}
              </ul>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-1 font-semibold">Confidence: {confidenceLabel}</span>
              <span className={`rounded-full border px-2 py-1 font-semibold ${riskTheme.chip}`}>AI Assisted</span>
            </div>
            </div>
          </div>

          <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Chat Section</h2>

            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setChatInput(suggestion)}
                  disabled={!extractedText.trim() || chatLoading}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="h-[420px] xl:h-[520px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              {messages.map((message) => (
                <ChatBubble key={message.id} role={message.role} text={message.text} />
              ))}
              {chatLoading ? <p className="text-sm text-slate-500">Analyzing your question...</p> : null}
              <div ref={messageEndRef} />
            </div>

            <form onSubmit={handleReportChat} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about findings in simple language..."
                maxLength={2000}
                disabled={!extractedText.trim() || chatLoading}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || !extractedText.trim() || chatLoading}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {chatLoading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <p className="pb-2 text-xs text-slate-500">
        This system provides AI-based insights and is not a medical diagnosis. Please consult a doctor.
      </p>
    </section>
  );
}

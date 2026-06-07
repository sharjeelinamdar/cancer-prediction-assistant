import type { StructuredParameter } from "./api";
import { STRUCTURED_REPORT_FIXTURES } from "./structuredReportFixtures";

export type ReportHistoryItem = {
  id: string;
  name: string;
  uploadedAt: string;
  riskLevel: "Low" | "Moderate" | "High";
  riskReasons: string[];
  confidence: "Low" | "Medium" | "High" | "N/A";
  insights: string[];
  summary: string;
  highlightedKeywords?: string[];
  extractedText?: string;
  structuredData?: Record<string, StructuredParameter>;
  savedFilePath?: string;
};

export const DASHBOARD_STORAGE_KEY = "oncoassist.latestReport";
export const REPORT_HISTORY_STORAGE_KEY = "oncoassist.reportHistory";
export const SELECTED_REPORT_STORAGE_KEY = "oncoassist.selectedReport";

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function buildExtractedText(structuredData: Record<string, StructuredParameter>): string {
  return Object.entries(structuredData)
    .map(
      ([name, param]) =>
        `${toTitleCase(name)}: ${param.value} (reference ${param.range[0]} - ${param.range[1]}) status ${param.status}`
    )
    .join("\n");
}

function buildSummary(structuredData: Record<string, StructuredParameter>): string {
  const abnormalities = Object.entries(structuredData).filter(([, param]) => param.status !== "normal");
  const abnormalText =
    abnormalities.length > 0
      ? abnormalities
          .map(([name, param]) => `${toTitleCase(name)} is ${param.status} (${param.value}; range ${param.range[0]}-${param.range[1]})`)
          .join("; ")
      : "No clear abnormalities were detected from the extracted parameters.";

  const keyFindings =
    abnormalities.length > 0
      ? `Detected ${abnormalities.length} parameter(s) outside the reference range.`
      : "Most measured values appear within the listed reference ranges.";

  const explanation =
    abnormalities.length > 0
      ? "These changes can be due to infection, inflammation, nutrition, or recovery patterns. Clinical correlation is required."
      : "This pattern is generally reassuring, but trends and symptoms still matter for interpretation.";

  return [
    "Key Findings:",
    `- ${keyFindings}`,
    "",
    "Abnormal Values:",
    `- ${abnormalText}`,
    "",
    "Simple Explanation:",
    `- ${explanation}`,
  ].join("\n");
}

function computeRisk(structuredData: Record<string, StructuredParameter>): {
  riskLevel: "Low" | "Moderate" | "High";
  riskReasons: string[];
  insights: string[];
  highlightedKeywords: string[];
} {
  const abnormalities = Object.entries(structuredData).filter(([, param]) => param.status !== "normal");
  const highCount = abnormalities.filter(([, param]) => param.status === "high").length;

  const riskLevel: "Low" | "Moderate" | "High" =
    abnormalities.length >= 3 || highCount >= 2 ? "High" : abnormalities.length >= 1 ? "Moderate" : "Low";

  const riskReasons =
    abnormalities.length > 0
      ? abnormalities.map(
          ([name, param]) => `${toTitleCase(name)} is ${param.status} (${param.value}; ref ${param.range[0]}-${param.range[1]}).`
        )
      : ["No significant out-of-range values were detected."];

  const insights =
    abnormalities.length > 0
      ? abnormalities.map(([name, param]) => `${param.status === "high" ? "High" : "Low"} ${toTitleCase(name)}`)
      : ["Most values normal"];

  const highlightedKeywords = abnormalities.map(([name]) => name);

  return { riskLevel, riskReasons, insights, highlightedKeywords };
}

function hasFullContext(item: ReportHistoryItem): boolean {
  return Boolean(
    item.summary &&
      item.extractedText &&
      item.structuredData &&
      Object.keys(item.structuredData).length > 0 &&
      item.riskLevel
  );
}

export function loadReportHistory(): ReportHistoryItem[] {
  try {
    const raw = localStorage.getItem(REPORT_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ReportHistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveReportHistory(items: ReportHistoryItem[]): void {
  localStorage.setItem(REPORT_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function appendReportHistory(item: ReportHistoryItem): void {
  const current = loadReportHistory();
  const updated = [item, ...current].slice(0, 25);
  saveReportHistory(updated);
}

export function ensureDummyHistory(seedCount = 6): ReportHistoryItem[] {
  const existing = loadReportHistory();
  const withContext = existing.filter(hasFullContext);

  const fixtureItems = STRUCTURED_REPORT_FIXTURES.slice(0, Math.max(3, seedCount)).map((fixture, index) => {
    const risk = computeRisk(fixture.data);
    return {
      id: `fixture-${index + 1}`,
      name: fixture.report_name,
      uploadedAt: fixture.saved_at_utc,
      riskLevel: risk.riskLevel,
      riskReasons: risk.riskReasons,
      confidence: computeConfidenceLabel(fixture.data),
      insights: risk.insights,
      summary: buildSummary(fixture.data),
      highlightedKeywords: risk.highlightedKeywords,
      extractedText: buildExtractedText(fixture.data),
      structuredData: fixture.data,
      savedFilePath: `structured_reports/fixture-${index + 1}.json`,
    } satisfies ReportHistoryItem;
  });

  const nonFixtureHistory = withContext.filter((item) => !item.id.startsWith("fixture-"));
  const merged = [...nonFixtureHistory, ...fixtureItems]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 25);

  saveReportHistory(merged);
  return merged;
}

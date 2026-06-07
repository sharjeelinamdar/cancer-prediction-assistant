import type { StructuredParameter } from "./api";

export type StructuredReportFixture = {
  saved_at_utc: string;
  source: "report-analyze";
  data: Record<string, StructuredParameter>;
  report_name: string;
};

export const STRUCTURED_REPORT_FIXTURES: StructuredReportFixture[] = [
  {
    saved_at_utc: "2026-03-01T09:15:12.000Z",
    source: "report-analyze",
    report_name: "Baseline Blood Panel - Mar 01",
    data: {
      hemoglobin: { value: 14.9, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.92, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 8420, range: [4000, 10000], status: "normal", confidence: "high" },
      platelets: { value: 182000, range: [150000, 410000], status: "normal", confidence: "high" },
      mpv: { value: 9.5, range: [7.5, 10.3], status: "normal", confidence: "high" },
      neutrophils: { value: 62, range: [40, 80], status: "normal", confidence: "high" },
      lymphocytes: { value: 28, range: [20, 40], status: "normal", confidence: "high" },
      vitamin_b12: { value: 262, range: [187, 833], status: "normal", confidence: "medium" },
    },
  },
  {
    saved_at_utc: "2026-03-08T10:40:50.000Z",
    source: "report-analyze",
    report_name: "Acute Flare Review - Mar 08",
    data: {
      hemoglobin: { value: 13.8, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.61, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 11680, range: [4000, 10000], status: "high", confidence: "high" },
      platelets: { value: 428000, range: [150000, 410000], status: "high", confidence: "high" },
      mpv: { value: 9.9, range: [7.5, 10.3], status: "normal", confidence: "high" },
      neutrophils: { value: 78, range: [40, 80], status: "normal", confidence: "high" },
      lymphocytes: { value: 18, range: [20, 40], status: "low", confidence: "high" },
      vitamin_b12: { value: 171, range: [187, 833], status: "low", confidence: "medium" },
    },
  },
  {
    saved_at_utc: "2026-03-15T12:22:33.000Z",
    source: "report-analyze",
    report_name: "Recovery Check - Mar 15",
    data: {
      hemoglobin: { value: 14.1, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.73, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 9640, range: [4000, 10000], status: "normal", confidence: "high" },
      platelets: { value: 231000, range: [150000, 410000], status: "normal", confidence: "high" },
      mpv: { value: 10.8, range: [7.5, 10.3], status: "high", confidence: "medium" },
      neutrophils: { value: 71, range: [40, 80], status: "normal", confidence: "high" },
      lymphocytes: { value: 24, range: [20, 40], status: "normal", confidence: "high" },
      vitamin_b12: { value: 209, range: [187, 833], status: "normal", confidence: "medium" },
    },
  },
  {
    saved_at_utc: "2026-03-22T08:05:05.000Z",
    source: "report-analyze",
    report_name: "Relapse Window - Mar 22",
    data: {
      hemoglobin: { value: 13.5, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.57, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 11990, range: [4000, 10000], status: "high", confidence: "high" },
      platelets: { value: 415000, range: [150000, 410000], status: "high", confidence: "medium" },
      mpv: { value: 11.2, range: [7.5, 10.3], status: "high", confidence: "medium" },
      neutrophils: { value: 83, range: [40, 80], status: "high", confidence: "medium" },
      lymphocytes: { value: 17, range: [20, 40], status: "low", confidence: "high" },
      vitamin_b12: { value: 160, range: [187, 833], status: "low", confidence: "medium" },
    },
  },
  {
    saved_at_utc: "2026-03-26T08:05:05.000Z",
    source: "report-analyze",
    report_name: "Improvement Snapshot - Mar 26",
    data: {
      hemoglobin: { value: 14.0, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.68, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 10240, range: [4000, 10000], status: "high", confidence: "medium" },
      platelets: { value: 268000, range: [150000, 410000], status: "normal", confidence: "high" },
      mpv: { value: 10.1, range: [7.5, 10.3], status: "normal", confidence: "high" },
      neutrophils: { value: 76, range: [40, 80], status: "normal", confidence: "high" },
      lymphocytes: { value: 21, range: [20, 40], status: "normal", confidence: "high" },
      vitamin_b12: { value: 176, range: [187, 833], status: "low", confidence: "medium" },
    },
  },
  {
    saved_at_utc: "2026-03-29T08:05:05.000Z",
    source: "report-analyze",
    report_name: "Recent Follow-up - Mar 29",
    data: {
      hemoglobin: { value: 14.3, range: [13.0, 16.5], status: "normal", confidence: "high" },
      rbc: { value: 4.8, range: [4.5, 5.5], status: "normal", confidence: "high" },
      wbc: { value: 9890, range: [4000, 10000], status: "normal", confidence: "high" },
      platelets: { value: 246000, range: [150000, 410000], status: "normal", confidence: "high" },
      mpv: { value: 10.5, range: [7.5, 10.3], status: "high", confidence: "medium" },
      neutrophils: { value: 74, range: [40, 80], status: "normal", confidence: "high" },
      lymphocytes: { value: 20, range: [20, 40], status: "normal", confidence: "high" },
      vitamin_b12: { value: 196, range: [187, 833], status: "normal", confidence: "medium" },
    },
  },
];

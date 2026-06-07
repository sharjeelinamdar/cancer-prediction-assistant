import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { loadReportHistory } from "../lib/reportHistory";

ChartJS.register(ArcElement, Tooltip, Legend);

type DashboardSnapshot = {
  updatedAt: string;
  summary: string;
  riskLevel: "Low" | "Moderate" | "High";
  riskReasons: string[];
  insights: string[];
  confidence: "Low" | "Medium" | "High" | "N/A";
};

const STORAGE_KEY = "oncoassist.latestReport";

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRiskTheme(risk: "Low" | "Moderate" | "High") {
  if (risk === "High") {
    return {
      badge: "text-red-800 bg-red-100 border-red-300",
      panel: "from-slate-50 via-red-50 to-slate-100 border-l-red-600",
      pulse: "risk-pulse",
      kpi: "border-red-300 bg-red-50 text-red-800",
      ring: "#b91c1c",
    };
  }
  if (risk === "Moderate") {
    return {
      badge: "text-amber-800 bg-amber-100 border-amber-300",
      panel: "from-slate-50 via-amber-50 to-slate-100 border-l-amber-600",
      pulse: "",
      kpi: "border-amber-300 bg-amber-50 text-amber-800",
      ring: "#a16207",
    };
  }
  return {
    badge: "text-emerald-800 bg-emerald-100 border-emerald-300",
    panel: "from-slate-50 via-emerald-50 to-slate-100 border-l-emerald-600",
    pulse: "",
    kpi: "border-emerald-300 bg-emerald-50 text-emerald-800",
    ring: "#2f855a",
  };
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.4 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 6-6" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 5a3 3 0 1 0-6 0c0 1.5 1 2.7 2.3 3.1A3 3 0 0 0 4 14h1" />
      <path d="M16 5a3 3 0 1 1 6 0c0 1.5-1 2.7-2.3 3.1A3 3 0 0 1 20 14h-1" />
      <path d="M9 18a3 3 0 0 1-3-3V8a3 3 0 0 1 6 0v7a3 3 0 0 1-3 3Z" />
      <path d="M15 18a3 3 0 0 0 3-3V8a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3Z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as DashboardSnapshot;
      setSnapshot(parsed);
    } catch {
      setSnapshot(null);
    }
  }, []);

  const latestStructured = useMemo(() => {
    const history = loadReportHistory()
      .filter((item) => item.structuredData && Object.keys(item.structuredData).length > 0)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return history[0]?.structuredData ?? {};
  }, []);

  const parameterEntries = useMemo(() => Object.entries(latestStructured), [latestStructured]);
  const normalCount = useMemo(
    () => parameterEntries.filter(([, param]) => param.status === "normal").length,
    [parameterEntries]
  );
  const highCount = useMemo(
    () => parameterEntries.filter(([, param]) => param.status === "high").length,
    [parameterEntries]
  );
  const lowCount = useMemo(
    () => parameterEntries.filter(([, param]) => param.status === "low").length,
    [parameterEntries]
  );

  const abnormalCount = highCount + lowCount;
  const parameterCount = parameterEntries.length;

  const risk = snapshot?.riskLevel ?? "Low";
  const riskTheme = getRiskTheme(risk);
  const riskScore = risk === "High" ? 90 : risk === "Moderate" ? 62 : 32;

  const ringStyle = useMemo(
    () => ({
      background: `conic-gradient(${riskTheme.ring} ${riskScore}%, rgba(148,163,184,0.22) ${riskScore}% 100%)`,
    }),
    [riskScore, riskTheme.ring]
  );

  const chartData = useMemo<ChartData<"doughnut">>(
    () => ({
      labels: ["Normal", "Abnormal", "Critical"],
      datasets: [
        {
          data: [normalCount, abnormalCount, highCount],
          backgroundColor: ["#2f855a", "#a16207", "#b91c1c"],
          borderColor: ["#276749", "#92400e", "#991b1b"],
          borderWidth: 1,
          hoverOffset: 6,
        },
      ],
    }),
    [abnormalCount, highCount, normalCount]
  );

  const chartOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: {
              size: 11,
            },
            color: "#334155",
          },
        },
      },
      animation: {
        duration: 1200,
      },
    }),
    []
  );

  const detectedIssues = useMemo(() => {
    if (snapshot?.riskReasons?.length) {
      return snapshot.riskReasons.slice(0, 6);
    }
    return parameterEntries
      .filter(([, param]) => param.status !== "normal")
      .slice(0, 6)
      .map(([name, param]) => `${toTitleCase(name)} is ${param.status} (${param.value})`);
  }, [parameterEntries, snapshot?.riskReasons]);

  const insightChips = useMemo(() => {
    const chips = new Set<string>();

    chips.add(`${risk} Risk Pattern`);
    chips.add(`${normalCount} Stable Parameters`);

    if (highCount >= 2) {
      chips.add("Elevated Marker Cluster");
    }
    if (lowCount >= 2) {
      chips.add("Deficiency Pattern");
    }

    const abnormalNames = parameterEntries
      .filter(([, param]) => param.status !== "normal")
      .map(([name]) => name.toLowerCase());

    if (abnormalNames.some((name) => name.includes("wbc") || name.includes("lymph"))) {
      chips.add("Immune Profile Shift");
    }
    if (abnormalNames.some((name) => name.includes("vitamin_b12") || name.includes("b12"))) {
      chips.add("B12 Monitoring Signal");
    }
    if (abnormalNames.some((name) => name.includes("mpv") || name.includes("platelet"))) {
      chips.add("Platelet Dynamics Watch");
    }

    return Array.from(chips).slice(0, 10);
  }, [highCount, lowCount, normalCount, parameterEntries, risk]);

  const capabilityItems = [
    { label: "Report Analysis", icon: <FileIcon /> },
    { label: "Risk Detection", icon: <TrendIcon /> },
    { label: "Cancer Signals", icon: <AlertIcon /> },
    { label: "AI Assistant", icon: <ChatIcon /> },
  ];

  const kpiCards = [
    { label: "Risk Level", value: risk, className: riskTheme.kpi, icon: <AlertIcon /> },
    {
      label: "Abnormal Values",
      value: String(abnormalCount),
      className: "border-amber-300 bg-amber-50 text-amber-800",
      icon: <AlertIcon />,
    },
    {
      label: "Parameters Analyzed",
      value: String(parameterCount || 0),
      className: "border-slate-300 bg-slate-100 text-slate-800",
      icon: <TrendIcon />,
    },
    {
      label: "Confidence",
      value: snapshot?.confidence ?? "N/A",
      className: "border-emerald-300 bg-emerald-50 text-emerald-800",
      icon: <BrainIcon />,
    },
  ];

  return (
    <section className="mx-auto max-w-[1200px] space-y-6">
      <div className="fade-in-up rounded-3xl border border-slate-300 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 p-6 text-slate-100 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">AI-Powered Clinical Intelligence</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">AI Cancer Risk Intelligence Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Real-time risk visualization, abnormal pattern detection, and clinical guidance in one intelligent system.
            </p>
          </div>

          <Link
            to="/upload"
            className="activity-indicator rounded-2xl border border-slate-400/40 bg-slate-900/25 px-4 py-3 backdrop-blur-sm transition hover:scale-[1.01] hover:bg-slate-900/35"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-200">AI Analysis Active</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-100">
              <span>Analyzing patterns</span>
              <span className="ai-dot-loader" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Open Upload Report</p>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <article
            key={card.label}
            className={`fade-in-up rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{card.label}</span>
              <span>{card.icon}</span>
            </div>
            <p className="text-3xl font-bold tracking-tight">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={`fade-in-up rounded-3xl border border-l-4 bg-gradient-to-br ${riskTheme.panel} p-6 shadow-md ring-1 ring-white lg:col-span-7`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Cancer Risk Indicator</p>
              <p className="mt-1 text-5xl font-black tracking-tight text-slate-900">{risk.toUpperCase()}</p>
              <p className="mt-2 text-sm text-slate-700">
                {snapshot?.updatedAt ? `Updated ${new Date(snapshot.updatedAt).toLocaleString()}` : "Awaiting report analysis"}
              </p>
              <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskTheme.badge} ${riskTheme.pulse}`}>
                Confidence: {snapshot?.confidence ?? "N/A"}
              </div>
            </div>

            <div className="relative flex h-32 w-32 items-center justify-center rounded-full p-2" style={ringStyle}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-slate-900">
                <p className="text-2xl font-extrabold">{riskScore}%</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Risk Signal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-pulse fade-in-up rounded-3xl border border-slate-400 bg-slate-50 p-5 shadow-md lg:col-span-5">
          <div className="mb-2 border-b border-slate-300 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Health Distribution</p>
          </div>
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm lg:col-span-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Detected Issues</h2>
          <div className="space-y-2">
            {detectedIssues.length > 0 ? (
              detectedIssues.map((issue) => {
                const normalized = issue.toLowerCase();
                const isHigh = /high|elevat|critical|above/.test(normalized);
                const style = isHigh
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-amber-300 bg-amber-50 text-amber-800";
                return (
                  <div key={issue} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${style}`}>
                    <div className="flex items-center gap-2">
                      <AlertIcon />
                      <span className="text-sm font-semibold">{issue}</span>
                    </div>
                    <span className="text-xs font-semibold">{isHigh ? "High" : "Low"}</span>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                No detected issues yet.
              </div>
            )}
          </div>
          <p className="mt-4 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            Some detected parameters may be relevant for further cancer screening.
          </p>
        </div>

        <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm lg:col-span-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Insights Chips</h2>
          <div className="flex flex-wrap gap-2">
            {insightChips.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {item}
              </span>
            ))}
            {insightChips.length === 0 && (
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                Analyze a report to generate signal chips
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Summary Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Normal</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900">{normalCount}</p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Abnormal</p>
            <p className="mt-1 text-3xl font-bold text-amber-900">{abnormalCount}</p>
          </div>
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Critical</p>
            <p className="mt-1 text-3xl font-bold text-red-900">{highCount}</p>
          </div>
        </div>
      </div>

      <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Capabilities</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-center transition duration-200 hover:scale-[1.02] hover:border-slate-400 hover:bg-white"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700">
                {item.icon}
              </div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="fade-in-up rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Link
            to="/upload"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:scale-[1.01] hover:bg-slate-100"
          >
            Upload New Report
          </Link>
          <Link
            to="/upload"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:scale-[1.01] hover:bg-slate-100"
          >
            Open Report Workspace
          </Link>
          <Link
            to="/chat"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:scale-[1.01] hover:bg-slate-100"
          >
            Symptom Chat Assistant
          </Link>
          <Link
            to="/history"
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:scale-[1.01] hover:bg-slate-100"
          >
            View Report History
          </Link>
        </div>
      </div>

      <p className="pb-2 text-xs text-slate-500">
        This system provides AI-based insights and is not a medical diagnosis. Please consult a qualified doctor.
      </p>
    </section>
  );
}

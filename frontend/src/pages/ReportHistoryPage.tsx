import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Bar, Line, Radar } from "react-chartjs-2";

import {
  DASHBOARD_STORAGE_KEY,
  SELECTED_REPORT_STORAGE_KEY,
  ensureDummyHistory,
  type ReportHistoryItem,
} from "../lib/reportHistory";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

ChartJS.register(BarElement, RadialLinearScale);

type RiskLevel = "Low" | "Moderate" | "High";

type ParameterStatus = "low" | "normal" | "high";

type TimelinePoint = {
  id: string;
  name: string;
  uploadedAt: string;
  riskLevel: RiskLevel;
  structuredData: ReportHistoryItem["structuredData"];
};

function riskScore(risk: RiskLevel): number {
  if (risk === "High") return 3;
  if (risk === "Moderate") return 2;
  return 1;
}

function riskTheme(risk: RiskLevel) {
  if (risk === "High") return "border-red-200 bg-red-50 text-red-700";
  if (risk === "Moderate") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusColor(status: ParameterStatus): string {
  if (status === "high") return "text-red-700 bg-red-100 border-red-200";
  if (status === "low") return "text-amber-700 bg-amber-100 border-amber-200";
  return "text-emerald-700 bg-emerald-100 border-emerald-200";
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ReportHistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReportHistoryItem[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string>("wbc");

  useEffect(() => {
    const seeded = ensureDummyHistory();
    setItems(seeded);
  }, []);

  const timeline = useMemo<TimelinePoint[]>(() => {
    return [...items]
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
      .map((item) => ({
        id: item.id,
        name: item.name,
        uploadedAt: item.uploadedAt,
        riskLevel: item.riskLevel,
        structuredData: item.structuredData,
      }));
  }, [items]);

  const availableParameters = useMemo(() => {
    const names = new Set<string>();
    for (const entry of timeline) {
      const data = entry.structuredData ?? {};
      for (const name of Object.keys(data)) {
        names.add(name);
      }
    }
    return [...names];
  }, [timeline]);

  useEffect(() => {
    if (availableParameters.length === 0) {
      return;
    }
    if (!availableParameters.includes(selectedParameter)) {
      setSelectedParameter(availableParameters[0]);
    }
  }, [availableParameters, selectedParameter]);

  const riskChartData = useMemo(() => {
    return {
      labels: timeline.map((item) => new Date(item.uploadedAt).toLocaleDateString()),
      datasets: [
        {
          label: "Risk Trend",
          data: timeline.map((item) => riskScore(item.riskLevel)),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "#1d4ed8",
        },
      ],
    };
  }, [timeline]);

  const parameterChartData = useMemo(() => {
    const labels = timeline.map((item) => new Date(item.uploadedAt).toLocaleDateString());
    const values = timeline.map((item) => item.structuredData?.[selectedParameter]?.value ?? null);
    const lower = timeline.map((item) => item.structuredData?.[selectedParameter]?.range?.[0] ?? null);
    const upper = timeline.map((item) => item.structuredData?.[selectedParameter]?.range?.[1] ?? null);

    return {
      labels,
      datasets: [
        {
          label: `${toTitleCase(selectedParameter)} Value`,
          data: values,
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.14)",
          tension: 0.35,
          pointRadius: 4,
          fill: true,
        },
        {
          label: "Lower Ref",
          data: lower,
          borderColor: "#64748b",
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0,
        },
        {
          label: "Upper Ref",
          data: upper,
          borderColor: "#64748b",
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0,
        },
      ],
    };
  }, [selectedParameter, timeline]);

  const abnormalCountChartData = useMemo(() => {
    const labels = timeline.map((item) => new Date(item.uploadedAt).toLocaleDateString());
    const highCounts = timeline.map((item) =>
      Object.values(item.structuredData ?? {}).filter((param) => param.status === "high").length
    );
    const lowCounts = timeline.map((item) =>
      Object.values(item.structuredData ?? {}).filter((param) => param.status === "low").length
    );

    return {
      labels,
      datasets: [
        {
          label: "High Parameters",
          data: highCounts,
          backgroundColor: "rgba(239, 68, 68, 0.75)",
          borderRadius: 8,
        },
        {
          label: "Low Parameters",
          data: lowCounts,
          backgroundColor: "rgba(245, 158, 11, 0.75)",
          borderRadius: 8,
        },
      ],
    };
  }, [timeline]);

  const latestWithStructured = useMemo(() => {
    const reversed = [...timeline].reverse();
    return reversed.find((item) => item.structuredData && Object.keys(item.structuredData).length > 0) ?? null;
  }, [timeline]);

  const latestParameterEntries = useMemo(() => {
    if (!latestWithStructured?.structuredData) {
      return [];
    }
    return Object.entries(latestWithStructured.structuredData);
  }, [latestWithStructured]);

  const radarChartData = useMemo(() => {
    if (latestParameterEntries.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const topEntries = latestParameterEntries.slice(0, 8);
    const labels = topEntries.map(([name]) => toTitleCase(name));
    const normalizedValues = topEntries.map(([, param]) => {
      const min = param.range[0];
      const max = param.range[1];
      const span = Math.max(0.0001, max - min);
      return ((param.value - min) / span) * 100;
    });

    return {
      labels,
      datasets: [
        {
          label: "Latest Report Parameter Position (%)",
          data: normalizedValues,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.18)",
          pointBackgroundColor: "#6d28d9",
        },
      ],
    };
  }, [latestParameterEntries]);

  const riskChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) => {
              const y = Number(ctx.parsed.y ?? 0);
              if (y >= 3) return "High Risk";
              if (y >= 2) return "Moderate Risk";
              return "Low Risk";
            },
          },
        },
      },
      scales: {
        y: {
          min: 0.8,
          suggestedMax: 3.4,
          grace: 0.2,
          ticks: {
            stepSize: 0.5,
            callback: (value: string | number) => {
              const numeric = Number(value);
              if (!Number.isInteger(numeric)) return "";
              if (numeric === 3) return "High";
              if (numeric === 2) return "Moderate";
              if (numeric === 1) return "Low";
              return "";
            },
          },
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  const parameterChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  const barChartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    []
  );

  const radarOptions = useMemo<ChartOptions<"radar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
          },
          pointLabels: {
            color: "#334155",
            font: {
              size: 11,
            },
          },
          grid: {
            color: "rgba(100, 116, 139, 0.25)",
          },
        },
      },
    }),
    []
  );

  const openReport = (item: ReportHistoryItem) => {
    localStorage.setItem(SELECTED_REPORT_STORAGE_KEY, JSON.stringify(item));
    localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({
        updatedAt: item.uploadedAt,
        summary: item.summary,
        riskLevel: item.riskLevel,
        riskReasons: item.riskReasons,
        insights: item.insights,
        confidence: item.confidence,
      })
    );
    navigate("/upload");
  };

  return (
    <section className="space-y-6">
      <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Report History</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Historical Report Timeline</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review previous report outcomes, compare risk patterns, and open any report directly in the analysis workspace.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Risk Trends</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Timeline View</span>
          </div>
          <div className="h-64 w-full">
            <Line data={riskChartData} options={riskChartOptions} />
          </div>
        </div>

        <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Abnormality Counts</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">High vs Low</span>
          </div>
          <div className="h-64 w-full">
            <Bar data={abnormalCountChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Parameter Trends</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Interactive Selector</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {availableParameters.map((name) => {
              const active = name === selectedParameter;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedParameter(name)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    active
                      ? "border-teal-200 bg-teal-100 text-teal-800"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50",
                  ].join(" ")}
                >
                  {toTitleCase(name)}
                </button>
              );
            })}
          </div>

          <div className="h-72 w-full">
            <Line data={parameterChartData} options={parameterChartOptions} />
          </div>
        </div>

        <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest Profile Map</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Radar</span>
          </div>
          <div className="h-72 w-full">
            <Radar data={radarChartData} options={radarOptions} />
          </div>
        </div>
      </div>

      {latestParameterEntries.length > 0 ? (
        <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Latest Report Parameter Status</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {latestWithStructured ? new Date(latestWithStructured.uploadedAt).toLocaleDateString() : "No data"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {latestParameterEntries.map(([name, param]) => (
              <div key={name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500">{toTitleCase(name)}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{param.value}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor(param.status)}`}>
                    {param.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ref: {param.range[0]} - {param.range[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Past Reports</h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openReport(item)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name || `Report ${index + 1}`}</p>
                  <p className="text-xs text-slate-500">{new Date(item.uploadedAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskTheme(item.riskLevel)}`}>
                  {item.riskLevel} Risk
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.insights.slice(0, 4).map((insight) => (
                  <span key={`${item.id}-${insight}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {insight}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

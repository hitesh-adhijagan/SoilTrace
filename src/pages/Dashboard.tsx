import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Download, ShieldCheck, Database, FileText } from "lucide-react";
import EvidenceBadge from "@/components/EvidenceBadge";
import SiteShell from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

const labels: Record<string, string> = {
  new: "New to topic",
  some: "Know a little",
  confident: "Confident",
  industry: "Industrial Plumes",
  agriculture: "Agrochemicals",
  waste: "E-Waste / Dumps",
  water: "Drain Infiltration",
  "not-sure": "Not sure",
  careful: "Actively careful",
  sometimes: "Sometimes",
  "1": "1 / 5 (Low)",
  "2": "2 / 5",
  "3": "3 / 5",
  "4": "4 / 5",
  "5": "5 / 5 (Critical)",
};

const chartRows = (values: Record<string, number> | undefined) =>
  Object.entries(values ?? {}).map(([key, count]) => ({
    name: labels[key] ?? key,
    count,
  }));

function ChartBlock({
  title,
  values,
  testId,
}: {
  title: string;
  values: Record<string, number>;
  testId: string;
}) {
  const data = chartRows(values);
  return (
    <div data-testid={testId} className="min-h-[280px] border-t border-ink/15 pt-5">
      <h3 data-testid={`${testId}-title`} className="font-mono text-xs uppercase tracking-[0.15em] text-muted font-bold">
        {title}
      </h3>
      <div className="mt-5 h-[220px] w-full">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="var(--chart-text)" fontSize={10} />
              <YAxis dataKey="name" type="category" width={110} stroke="var(--chart-text)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg)",
                  border: "1px solid var(--chart-grid)",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <Bar dataKey="count" fill="var(--leaf)" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div
            data-testid={`${testId}-empty`}
            className="flex h-full items-center justify-center border border-dashed border-ink/20 font-mono text-[10px] uppercase tracking-wider text-muted"
          >
            Awaiting protected aggregate
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ["survey-summary"],
    queryFn: () => apiGet<DashboardSummary>("/survey/summary"),
    retry: false,
  });

  const summary = summaryQuery.data;

  const downloadPublicAggregate = (format: "json" | "csv") => {
    if (!summary) return;
    let content = "";
    if (format === "json") {
      content = JSON.stringify(summary, null, 2);
    } else {
      const rows = [
        ["Category", "Indicator", "Count"],
        ...Object.entries(summary.awareness_breakdown || {}).map(([k, v]) => ["Awareness", labels[k] || k, String(v)]),
        ...Object.entries(summary.cause_breakdown || {}).map(([k, v]) => ["Perceived Cause", labels[k] || k, String(v)]),
        ...Object.entries(summary.practice_breakdown || {}).map(([k, v]) => ["Dietary Practice", labels[k] || k, String(v)]),
        ...Object.entries(summary.concern_breakdown || {}).map(([k, v]) => ["Concern Index", labels[k] || k, String(v)]),
      ];
      content = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    }

    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `soiltrace-public-aggregate.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success(`Public ${format.toUpperCase()} summary exported.`);
  };

  return (
    <SiteShell title="Analytics Dashboard">
      <div data-testid="dashboard-page" className="max-w-5xl mx-auto space-y-10 pb-12">
        {/* Page Heading */}
        <div
          data-testid="dashboard-heading"
          className="border-b border-ink/15 pb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta flex items-center gap-1.5 font-bold">
              <ShieldCheck size={13} className="text-leaf" /> Field Note 02 / Public Response Register
            </p>
            <h1 className="mt-2.5 font-serif text-3xl sm:text-5xl md:text-6xl leading-tight text-ink">
              The quiet <br />
              <em className="text-leaf">dashboard.</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-muted">
              Anonymous community summaries appear when the collective pulse meets strict k-anonymity privacy thresholds to protect individual perspectives.
            </p>
          </div>
          <EvidenceBadge status="reported" />
        </div>

        {/* Aggregate Status Card */}
        <section data-testid="dashboard-summary-panel" className="ink-frame bg-paper p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                data-testid="dashboard-response-count-label"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted font-bold"
              >
                Anonymous responses logged
              </p>
              <p
                data-testid="dashboard-response-count"
                className="mt-1 font-mono text-4xl sm:text-6xl text-leaf font-bold"
              >
                {summary?.total_responses ?? "—"}
              </p>
            </div>
            <div data-testid="dashboard-threshold" className="max-w-sm sm:text-right space-y-2">
              <EvidenceBadge status={summary?.is_available ? "reported" : "unavailable"} />
              <p
                data-testid="dashboard-threshold-copy"
                className="text-xs sm:text-sm leading-relaxed text-muted"
              >
                {summary?.message ?? "Loading the protected aggregate state…"}
              </p>
            </div>
          </div>

          {summary && !summary.is_available && (
            <div
              data-testid="dashboard-empty-state"
              className="mt-6 sm:mt-8 border-t border-dashed border-ink/20 pt-6 sm:pt-8"
            >
              <p data-testid="dashboard-empty-title" className="font-serif text-2xl sm:text-3xl text-ink">
                No public chart yet.
              </p>
              <p
                data-testid="dashboard-empty-copy"
                className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-muted"
              >
                The dashboard needs {summary.minimum_responses} verified responses before displaying group aggregate patterns. This is a privacy safeguard to preserve anonymity, not missing data.
              </p>
              <div
                data-testid="dashboard-empty-illustration"
                className="mt-5 h-2.5 sm:h-3 overflow-hidden rounded-full bg-ink/5"
              >
                <div
                  className="h-full bg-amber transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((summary.total_responses || 0) / summary.minimum_responses) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 4 Community Breakdown Charts */}
        {summary?.is_available && (
          <div data-testid="dashboard-charts" className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
            <ChartBlock
              title="Awareness level"
              values={summary.awareness_breakdown ?? {}}
              testId="dashboard-awareness-chart"
            />
            <ChartBlock
              title="Perceived causes"
              values={summary.cause_breakdown ?? {}}
              testId="dashboard-causes-chart"
            />
            <ChartBlock
              title="Practice confidence"
              values={summary.practice_breakdown ?? {}}
              testId="dashboard-practice-chart"
            />
            <ChartBlock
              title="Concern pulse"
              values={summary.concern_breakdown ?? {}}
              testId="dashboard-concern-chart"
            />
          </div>
        )}

        {/* Open Public Environmental Data Strip */}
        <section className="border-t border-ink/15 pt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-leaf font-bold flex items-center gap-1.5">
              <Database size={13} /> Open Environmental Data • Public Research Access
            </span>
            <p className="text-xs text-muted max-w-xl leading-relaxed">
              All community aggregate statistics are published openly under Open Government Data principles. Zero individual identifiers, names, or mobile numbers are ever collected or stored.
            </p>
          </div>
          {summary?.is_available && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => downloadPublicAggregate("json")}
                className="ink-button bg-paper hover:bg-leaf hover:text-paper text-ink flex items-center gap-1.5 font-mono text-xs font-bold border border-ink/20 cursor-pointer shadow-xs"
              >
                <Download size={13} /> Export Aggregate JSON
              </button>
              <button
                type="button"
                onClick={() => downloadPublicAggregate("csv")}
                className="ink-button bg-paper hover:bg-leaf hover:text-paper text-ink flex items-center gap-1.5 font-mono text-xs font-bold border border-ink/20 cursor-pointer shadow-xs"
              >
                <FileText size={13} /> Export Aggregate CSV
              </button>
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
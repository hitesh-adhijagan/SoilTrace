import { Badge } from "@/components/ui/badge";
import type { EvidenceStatus } from "@/lib/types";

const labels: Record<EvidenceStatus, string> = {
  verified: "Verified data",
  reported: "User reported",
  illustrative: "Illustrative",
  conceptual: "Conceptual simulation",
  unavailable: "Verified data unavailable",
};

const styles: Record<EvidenceStatus, string> = {
  verified: "border-emerald-700/30 bg-emerald-100 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-200",
  reported: "border-amber-700/30 bg-amber-100 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/50 dark:text-amber-200",
  illustrative: "border-sky-700/30 bg-sky-100 text-sky-950 dark:border-sky-400/30 dark:bg-sky-950/50 dark:text-sky-200",
  conceptual: "border-violet-700/30 bg-violet-100 text-violet-950 dark:border-violet-400/30 dark:bg-violet-950/50 dark:text-violet-200",
  unavailable: "border-stone-500/40 bg-stone-200 text-stone-800 dark:border-stone-400/30 dark:bg-stone-800 dark:text-stone-200",
};

export default function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  return (
    <Badge data-testid={`evidence-badge-${status}`} className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${styles[status]}`}>
      {labels[status]}
    </Badge>
  );
}
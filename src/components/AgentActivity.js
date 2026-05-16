import { Bot, CheckCircle2, Loader2, Route } from "lucide-react";

const fallbackSteps = [
  { agent: "Orchestrator", detail: "Ready", status: "idle" },
  { agent: "Analyzer", detail: "Idle", status: "idle" },
  { agent: "Generator", detail: "Idle", status: "idle" }
];

export default function AgentActivity({ steps = [], isLoading }) {
  const visibleSteps = steps.length ? steps : fallbackSteps;

  return (
    <section className="border-t border-white/10 bg-ink/45 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Route className="h-4 w-4 text-signal" />
        <h2 className="text-sm font-semibold text-white">Agents</h2>
      </div>
      <div className="space-y-2">
        {visibleSteps.slice(-6).map((step, index) => (
          <div key={`${step.agent}-${index}`} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mt-0.5">
              {isLoading && index === visibleSteps.length - 1 ? (
                <Loader2 className="h-4 w-4 animate-spin text-signal" />
              ) : step.status === "idle" ? (
                <Bot className="h-4 w-4 text-slate-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-limewash" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">{step.agent}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

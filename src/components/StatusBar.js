import { Braces, Check, FileCode2 } from "lucide-react";

export default function StatusBar({ blueprint, code, refreshKey }) {
  const componentCount = blueprint?.components?.length || 0;

  return (
    <div className="relative z-20 grid shrink-0 gap-2 border-b border-white/10 bg-white/[0.035] p-2 backdrop-blur-2xl sm:grid-cols-3">
      <StatusItem icon={Check} label="Preview" value={code ? `Live #${refreshKey}` : "Waiting"} />
      <StatusItem icon={Braces} label="Spec" value={blueprint?.name || "—"} />
      <StatusItem icon={FileCode2} label="Code" value={code ? `${componentCount || 1} components` : "—"} />
    </div>
  );
}

function StatusItem({ icon: Icon, label, value }) {
  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-white/25 hover:bg-white/[0.045]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 shadow-[0_0_18px_rgba(255,255,255,0.08)]">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-600">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  );
}

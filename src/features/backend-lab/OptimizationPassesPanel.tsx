import { useCompilerStore } from "../../store/compilerStore";

export function OptimizationPassesPanel() {
  const optimization = useCompilerStore((state) => state.backend?.optimization ?? null);
  if (!optimization) return <div className="p-4 text-xs text-slate-500">No optimization result.</div>;
  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
        <Metric label="Original" value={optimization.originalIR.length} />
        <Metric label="Optimized" value={optimization.optimizedIR.length} />
        <Metric label="Removed" value={optimization.originalIR.length - optimization.optimizedIR.length} />
        <Metric label="Events" value={optimization.events.length} />
      </div>
      {optimization.events.map((event) => (
        <div key={event.id} className="mb-2 border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300">
          <div className="font-semibold text-cyan-100">{event.type}</div>
          <div className="mt-1">{event.reason}</div>
          {event.before && <div className="mt-2 font-mono text-red-200">Before: {event.before}</div>}
          {event.after && <div className="font-mono text-emerald-200">After: {event.after}</div>}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border border-slate-800 bg-slate-950 p-2"><div className="text-slate-500">{label}</div><div className="text-lg font-semibold text-slate-100">{value}</div></div>;
}

import { useCompilerStore } from "../../store/compilerStore";

export function MachineOptimizationPanel() {
  const machine = useCompilerStore((state) => state.backend?.machineOptimization ?? null);
  if (!machine) return <div className="p-4 text-xs text-slate-500">No machine optimization.</div>;
  return <div className="h-full overflow-auto p-3 cc-scrollbar">{machine.events.map((event) => <div key={event.id} className="mb-2 border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-300"><div className="font-semibold text-cyan-100">{event.type}</div><div className="mt-1">{event.reason}</div>{event.before && <div className="mt-2 font-mono text-red-200">Before: {event.before}</div>}{event.after && <div className="font-mono text-emerald-200">After: {event.after}</div>}</div>)}</div>;
}

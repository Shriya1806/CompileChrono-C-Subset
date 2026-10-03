import { useCompilerStore } from "../../store/compilerStore";

export function OptimizedIrPanel() {
  const optimized = useCompilerStore((state) => state.backend?.optimization.optimizedIR ?? null);
  if (!optimized) return <div className="p-4 text-xs text-slate-500">No optimized IR.</div>;
  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      {optimized.map((instruction, index) => (
        <div key={instruction.id} className="mb-1 border border-slate-800 bg-slate-900/50 px-3 py-2 font-mono text-xs text-slate-300">
          {index + 1}. {instruction.text}
        </div>
      ))}
    </div>
  );
}

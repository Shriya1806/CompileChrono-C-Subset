import { useCompilerStore } from "../../store/compilerStore";

export function InstructionSelectionPanel() {
  const target = useCompilerStore((state) => state.backend?.target.targetInstructions ?? []);
  const optimized = useCompilerStore((state) => state.backend?.optimization.optimizedIR ?? []);
  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      {optimized.map((ir) => (
        <div key={ir.id} className="mb-3 border border-slate-800 bg-slate-900/50 p-3 text-xs">
          <div className="font-mono text-cyan-100">{ir.text}</div>
          <div className="mt-2 space-y-1">{target.filter((instruction) => instruction.sourceIrIds.includes(ir.id)).map((instruction) => <div key={instruction.id} className="font-mono text-slate-300">{instruction.text}</div>)}</div>
        </div>
      ))}
    </div>
  );
}

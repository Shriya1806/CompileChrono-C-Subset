import { useCompilerStore } from "../../store/compilerStore";

export function BasicBlocksPanel() {
  const backend = useCompilerStore((state) => state.backend);
  const selectIr = useCompilerStore((state) => state.selectIrInstruction);
  if (!backend) return <div className="p-4 text-xs text-slate-500">Basic blocks are available after IR generation.</div>;
  return (
    <div className="grid h-full auto-rows-max grid-cols-2 gap-3 overflow-auto p-3 cc-scrollbar">
      {backend.basicBlocks.map((block) => (
        <button key={block.id} onClick={() => selectIr(block.instructions[0]?.id ?? null)} className="border border-slate-800 bg-slate-900/50 p-3 text-left text-xs hover:border-cyan-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-cyan-100">{block.id}</span>
            <span className="font-mono text-slate-500">{block.startInstructionIndex + 1}-{block.endInstructionIndex + 1}</span>
          </div>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-slate-300">{block.instructions.map((instruction) => instruction.text).join("\n")}</pre>
          <div className="mt-2 text-slate-500">Succ: {block.successors.join(", ") || "-"} | Pred: {block.predecessors.join(", ") || "-"}</div>
        </button>
      ))}
    </div>
  );
}

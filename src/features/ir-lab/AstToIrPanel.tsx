import { useCompilerStore } from "../../store/compilerStore";

export function AstToIrPanel() {
  const ir = useCompilerStore((state) => state.ir);
  if (!ir) return <div className="p-4 text-xs text-slate-500">No AST to IR trace.</div>;
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-auto p-3 cc-scrollbar">
        {ir.instructions.map((instruction) => (
          <div key={instruction.id} className="mb-2 border border-slate-800 bg-slate-900/50 p-3 text-xs">
            <div className="font-mono text-cyan-100">{instruction.text}</div>
            <div className="mt-1 text-slate-500">AST node: {instruction.astNodeId ?? "-"}</div>
          </div>
        ))}
      </div>
      <aside className="border-l border-slate-800 p-3 text-xs text-slate-400">
        AST to IR lowering emits temporaries for expression subtrees in post-order, preserving parser precedence. Selecting a TAC row highlights the original source range.
      </aside>
    </div>
  );
}

import { useState } from "react";
import { TreeGraph } from "../../components/visualizations/TreeGraph";
import { useCompilerStore } from "../../store/compilerStore";
import { astToGraph, parseTreeToGraph } from "./utils";

export function ParseTreePanel() {
  const [viewMode, setViewMode] = useState<"normal" | "grammar">("normal");
  const syntax = useCompilerStore((state) => state.syntax);
  const ast = syntax?.ast;
  const parseRoot = syntax?.parseResult?.root;

  if (!syntax || (!ast && !parseRoot)) {
    return <div className="grid h-full place-items-center p-4 text-xs font-bold text-black">No syntax tree available.</div>;
  }

  const graphRoot = viewMode === "normal" && ast ? astToGraph(ast) : parseRoot ? parseTreeToGraph(parseRoot) : null;

  return (
    <div className="grid h-full grid-rows-[40px_minmax(0,1fr)]">
      <div className="flex items-center justify-between border-b border-black bg-slate-50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wide text-black">View Mode:</span>
          <button
            onClick={() => setViewMode("normal")}
            className={`rounded px-2.5 py-1 text-xs font-bold border-2 border-black transition-all ${
              viewMode === "normal" ? "bg-[#FEF08A] text-black shadow-[1.5px_1.5px_0px_0px_#000]" : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Normal Syntax Tree
          </button>
          <button
            onClick={() => setViewMode("grammar")}
            className={`rounded px-2.5 py-1 text-xs font-bold border-2 border-black transition-all ${
              viewMode === "grammar" ? "bg-[#FEF08A] text-black shadow-[1.5px_1.5px_0px_0px_#000]" : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Full Grammar Parse Tree
          </button>
        </div>
        <span className="text-[11px] font-medium text-slate-600">
          {viewMode === "normal" ? "Clean semantic syntax tree for the source program" : "Raw grammar parse tree with intermediate non-terminals"}
        </span>
      </div>
      <div className="h-full overflow-hidden">
        <TreeGraph root={graphRoot} />
      </div>
    </div>
  );
}

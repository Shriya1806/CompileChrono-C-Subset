import { TreeGraph } from "../../components/visualizations/TreeGraph";
import { useCompilerStore } from "../../store/compilerStore";
import { astToGraph } from "./utils";

export function AstPanel() {
  const ast = useCompilerStore((state) => state.syntax?.ast ?? null);
  const selectedAstNodeId = useCompilerStore((state) => state.selectedAstNodeId);
  const selectAstNode = useCompilerStore((state) => state.selectAstNode);
  if (!ast) return <div className="grid h-full place-items-center p-4 text-xs text-slate-500">AST is available after a successful parse.</div>;
  return (
    <div className="grid h-full grid-rows-[36px_minmax(0,1fr)]">
      <div className="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">Parse Tree to AST abstraction: grammar scaffolding nodes collapse into semantic nodes. Click an AST node to highlight source.</div>
      <TreeGraph root={astToGraph(ast)} activeNodeId={selectedAstNodeId} onNodeClick={selectAstNode} />
    </div>
  );
}

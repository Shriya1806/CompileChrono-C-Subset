import { TreeGraph } from "../../components/visualizations/TreeGraph";
import type { TreeGraphNode } from "../../components/visualizations/TreeGraph";
import type { AstNode } from "../../compiler/syntax/ast/astTypes";
import { useCompilerStore, astChildren } from "../../store/compilerStore";
import { astLabel } from "../syntax-lab/utils";

export function AnnotatedAstPanel() {
  const ast = useCompilerStore((state) => state.syntax?.ast ?? null);
  const annotations = useCompilerStore((state) => state.semantic?.annotations ?? {});
  const selectedAstNodeId = useCompilerStore((state) => state.selectedAstNodeId);
  const selectAstNode = useCompilerStore((state) => state.selectAstNode);
  if (!ast) return <div className="p-4 text-xs text-slate-500">No AST.</div>;
  return <TreeGraph root={toGraph(ast)} activeNodeId={selectedAstNodeId} onNodeClick={selectAstNode} />;

  function toGraph(node: AstNode): TreeGraphNode {
    const annotation = annotations[node.id];
    return {
      id: node.id,
      label: astLabel(node),
      detail: [annotation?.resolvedType ? `Type: ${annotation.resolvedType}` : "", annotation?.resolvedSymbolId ? `Symbol: ${annotation.resolvedSymbolId}` : ""].filter(Boolean).join("\n"),
      children: astChildren(node).map(toGraph)
    };
  }
}

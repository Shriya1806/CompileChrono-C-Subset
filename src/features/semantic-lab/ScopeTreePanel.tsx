import { TreeGraph } from "../../components/visualizations/TreeGraph";
import type { TreeGraphNode } from "../../components/visualizations/TreeGraph";
import { useCompilerStore } from "../../store/compilerStore";

export function ScopeTreePanel() {
  const semantic = useCompilerStore((state) => state.semantic);
  if (!semantic) return <div className="p-4 text-xs text-slate-500">No scope tree.</div>;
  const root = semantic.scopes.find((scope) => !scope.parentScopeId);
  return <TreeGraph root={root ? toGraph(root.id) : null} />;

  function toGraph(scopeId: string): TreeGraphNode {
    const scope = semantic!.scopes.find((item) => item.id === scopeId)!;
    const symbols = semantic!.symbols.filter((symbol) => symbol.scopeId === scopeId);
    const children = [
      ...symbols.map((symbol): TreeGraphNode => ({ id: symbol.id, label: symbol.name, detail: `${symbol.kind}: ${symbol.type}` })),
      ...semantic!.scopes.filter((child) => child.parentScopeId === scopeId).map((child) => toGraph(child.id))
    ];
    return { id: scope.id, label: scope.name, detail: scope.kind, children };
  }
}

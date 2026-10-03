import { useCompilerStore } from "../../store/compilerStore";

export function SemanticErrorsPanel() {
  const errors = useCompilerStore((state) => state.errors.filter((error) => error.phase === "SEMANTIC"));
  const selectError = useCompilerStore((state) => state.selectError);
  if (errors.length === 0) return <div className="p-4 text-xs text-slate-500">No semantic errors.</div>;
  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      {errors.map((error) => (
        <button key={error.id} onClick={() => selectError(error.id)} className="mb-2 block w-full border border-red-500/40 bg-red-500/10 p-3 text-left text-xs text-red-100">
          <div className="font-semibold">{error.code ?? "SEMANTIC_ERROR"}</div>
          <div className="mt-1">{error.message}</div>
          <div className="mt-2 font-mono">Line {error.line}, Column {error.column}</div>
          {(error.expected || error.actual) && <div className="mt-1 font-mono">Expected: {String(error.expected ?? "-")} / Actual: {error.actual ?? error.found ?? "-"}</div>}
        </button>
      ))}
    </div>
  );
}

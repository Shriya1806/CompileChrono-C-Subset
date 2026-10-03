import { AlertTriangle } from "lucide-react";
import { useCompilerStore } from "../../store/compilerStore";

export function ErrorPanel() {
  const errors = useCompilerStore((state) => state.errors);
  const selectedErrorId = useCompilerStore((state) => state.selectedErrorId);
  const selectError = useCompilerStore((state) => state.selectError);

  if (errors.length === 0) {
    return <div className="p-3 text-xs text-slate-500">No compiler errors. Lexical and syntax analysis are clean.</div>;
  }

  return (
    <div className="space-y-2 overflow-auto p-3 cc-scrollbar">
      {errors.map((error) => (
        <button
          key={error.id}
          onClick={() => selectError(error.id)}
          className={`block w-full border p-3 text-left text-xs ${selectedErrorId === error.id ? "border-red-400 bg-red-500/10" : "border-slate-800 bg-slate-900/50 hover:border-red-800"}`}
        >
          <div className="flex items-center gap-2 font-semibold text-red-200">
            <AlertTriangle size={14} />
            {error.phase} ERROR
          </div>
          <div className="mt-2 text-slate-300">
            Line {error.line}, Column {error.column}
          </div>
          <div className="mt-1 text-slate-400">{error.message}</div>
          {Array.isArray(error.expected) && (
            <div className="mt-2">
              <div className="text-slate-500">Expected</div>
              <div className="font-mono text-cyan-100">{error.expected.join(", ")}</div>
            </div>
          )}
          {error.found && <div className="mt-2 font-mono text-red-200">Found: {error.found}</div>}
          {error.parserState?.currentNonTerminal && (
            <div className="mt-2 text-slate-400">
              Current non-terminal: <span className="font-mono text-slate-200">{error.parserState.currentNonTerminal}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

import { useCompilerStore } from "../../store/compilerStore";

export function TriplesPanel() {
  const ir = useCompilerStore((state) => state.ir);
  if (!ir) return <div className="p-4 text-xs text-slate-500">No triples.</div>;
  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-950 text-slate-500">
          <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Operator</th><th className="px-3 py-2">Arg1</th><th className="px-3 py-2">Arg2</th></tr>
        </thead>
        <tbody>{ir.triples.map((triple) => <tr key={triple.instructionId} className="border-t border-slate-900 text-slate-300"><td className="px-3 py-2 font-mono">{triple.index}</td><td className="px-3 py-2 font-mono">{triple.operator}</td><td className="px-3 py-2 font-mono">{triple.arg1}</td><td className="px-3 py-2 font-mono">{triple.arg2}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

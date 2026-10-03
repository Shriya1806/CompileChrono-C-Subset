import { productionText } from "../../compiler/syntax/grammar/grammarTypes";
import { useCompilerStore } from "../../store/compilerStore";

export function ParsingTablePanel() {
  const syntax = useCompilerStore((state) => state.syntax);
  const parserStepIndex = useCompilerStore((state) => state.parserStepIndex);
  if (!syntax) return <div className="p-4 text-xs font-bold text-black">No parsing table available.</div>;
  const step = syntax.parseResult.steps[parserStepIndex];
  const terminals = syntax.grammar.terminals;
  const activeCell = step?.selectedTableCell;

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar bg-white">
      {syntax.parsingTable.conflicts.length > 0 && (
        <div className="mb-3 rounded-xl border-2 border-black bg-[#FCA5A5] p-3 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000]">
          LL(1) conflicts: {syntax.parsingTable.conflicts.map((conflict) => `${conflict.nonTerminal}/${conflict.terminal}`).join(", ")}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
        <table className="w-full min-w-[900px] text-left text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-[#BAE6FD] px-3 py-2 font-black text-black">Non-Terminal</th>
              {terminals.map((terminal) => (
                <th key={terminal} className="px-3 py-2 font-mono font-black text-black bg-[#BAE6FD]">
                  {terminal}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {syntax.grammar.nonTerminals.map((nonTerminal) => (
              <tr key={nonTerminal}>
                <td className="sticky left-0 bg-[#FEF08A] font-mono font-black text-black border-r-2 border-b-2 border-black px-3 py-2">
                  {nonTerminal}
                </td>
                {terminals.map((terminal) => {
                  const production = syntax.parsingTable.cells[nonTerminal]?.[terminal];
                  const active = activeCell?.nonTerminal === nonTerminal && activeCell.terminal === terminal;
                  return (
                    <td
                      key={terminal}
                      className={`max-w-[220px] px-3 py-2 align-top border-r-2 border-b-2 border-black ${
                        active ? "bg-[#FEF08A] font-bold" : "bg-white text-black"
                      }`}
                    >
                      {production ? <span className="font-mono">{productionText(production)}</span> : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


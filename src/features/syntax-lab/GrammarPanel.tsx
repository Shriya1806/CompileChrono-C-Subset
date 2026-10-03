import { productionText } from "../../compiler/syntax/grammar/grammarTypes";
import { useCompilerStore } from "../../store/compilerStore";

export function GrammarPanel() {
  const syntax = useCompilerStore((state) => state.syntax);
  if (!syntax) return <div className="p-4 text-xs font-bold text-black">No syntax result available.</div>;

  return (
    <div className="h-full overflow-auto p-4 cc-scrollbar bg-white">
      <div className="max-w-3xl space-y-3">
        {syntax.grammar.nonTerminals.map((name) => {
          const prods = syntax.grammar.productions.filter((p) => p.lhs === name);
          return (
            <div key={name} className="rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
              <div className="font-mono text-sm font-black text-black">
                <span className="text-[#2563EB]">{name}</span>
                <span className="mx-2 text-black font-extrabold">→</span>
                <span className="text-black font-bold">
                  {prods
                    .map((p) => productionText(p).replace(`${name} -> `, "").replace(`${name} → `, ""))
                    .join("  |  ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


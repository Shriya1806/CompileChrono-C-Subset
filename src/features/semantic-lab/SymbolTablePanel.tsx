import { useMemo, useState } from "react";
import { useCompilerStore } from "../../store/compilerStore";

export function SymbolTablePanel() {
  const semantic = useCompilerStore((state) => state.semantic);
  const selectedSymbolId = useCompilerStore((state) => state.selectedSymbolId);
  const selectSymbol = useCompilerStore((state) => state.selectSymbol);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ALL");

  const symbols = useMemo(() => {
    return (semantic?.symbols ?? []).filter((symbol) => {
      const matchesQuery = symbol.name.toLowerCase().includes(query.toLowerCase()) || symbol.id.toLowerCase().includes(query.toLowerCase());
      const matchesKind = kind === "ALL" || symbol.kind === kind;
      return matchesQuery && matchesKind;
    });
  }, [kind, query, semantic?.symbols]);

  if (!semantic) return <div className="p-4 text-xs font-bold text-black">No symbol table available.</div>;

  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)] bg-white text-black p-3">
      <div className="flex items-center gap-2 pb-2">
        <input
          className="brutal-input flex-1"
          placeholder="Search symbols..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="brutal-input"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
        >
          {["ALL", "VARIABLE", "FUNCTION", "PARAMETER"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="overflow-auto cc-scrollbar rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th>Symbol / Name</th>
              <th>Data Type</th>
              <th>Kind / Category</th>
              <th>Scope</th>
              <th>Line of Declaration</th>
              <th>Memory Offset / Address</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => {
              const isSelected = selectedSymbolId === symbol.id;
              const memoryOffset = "memoryOffset" in symbol ? String(symbol.memoryOffset) : symbol.scopeId === "global" ? "0x1000" : "—";
              return (
                <tr
                  key={symbol.id}
                  onClick={() => selectSymbol(symbol.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FEF08A] font-bold" : "hover:bg-zinc-50 text-black"
                  }`}
                >
                  <td className="font-mono font-bold text-black">{symbol.name}</td>
                  <td className="font-mono text-black">{symbol.type}</td>
                  <td className="text-black">{symbol.kind}</td>
                  <td className="font-mono text-black">{symbol.scopeId}</td>
                  <td className="text-black">{symbol.declarationRange?.line ?? "1"}</td>
                  <td className="font-mono text-black">{memoryOffset}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


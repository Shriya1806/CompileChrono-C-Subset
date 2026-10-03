import { useCompilerStore } from "../../store/compilerStore";

export function FirstFollowPanel() {
  const syntax = useCompilerStore((state) => state.syntax);
  if (!syntax) return <div className="p-4 text-xs font-bold text-black">No syntax result available.</div>;

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar bg-white">
      <table className="w-full text-left text-xs">
        <thead>
          <tr>
            <th>Non-Terminal</th>
            <th>FIRST</th>
            <th>FOLLOW</th>
          </tr>
        </thead>
        <tbody>
          {syntax.grammar.nonTerminals.map((name) => {
            const firstList = [...(syntax.firstSets[name] ?? [])].sort().join(", ");
            const followList = [...(syntax.followSets[name] ?? [])].sort().join(", ");
            return (
              <tr key={name} className="hover:bg-zinc-50">
                <td className="font-mono font-bold text-black">{name}</td>
                <td className="font-mono text-black">{`{ ${firstList} }`}</td>
                <td className="font-mono text-black">{`{ ${followList} }`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


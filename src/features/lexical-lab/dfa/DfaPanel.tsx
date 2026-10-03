import { AutomataGraph } from "../../../components/visualizations/AutomataGraph";
import { useCompilerStore } from "../../../store/compilerStore";

export function DfaPanel() {
  const automata = useCompilerStore((state) => state.automata);

  return (
    <div className="h-full w-full bg-white p-3">
      <div className="h-full w-full overflow-hidden rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000000]">
        <AutomataGraph graphId="dfa-view" automaton={automata.dfa} />
      </div>
    </div>
  );
}


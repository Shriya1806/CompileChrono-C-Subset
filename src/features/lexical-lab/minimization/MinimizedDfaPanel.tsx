import { AutomataGraph } from "../../../components/visualizations/AutomataGraph";
import { BrutalBadge } from "../../../components/brutal/BrutalPrimitives";
import { useCompilerStore } from "../../../store/compilerStore";

export function MinimizedDfaPanel() {
  const automata = useCompilerStore((state) => state.automata);

  return (
    <div className="flex h-full w-full flex-col gap-3 p-3 bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <BrutalBadge tone="yellow">
            States Before: {automata.minimization.originalStateCount}
          </BrutalBadge>
          <BrutalBadge tone="blue">
            States After: {automata.minimization.minimizedStateCount}
          </BrutalBadge>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000000]">
        <AutomataGraph graphId="min-final-dfa" automaton={automata.minimizedDfa} />
      </div>
    </div>
  );
}


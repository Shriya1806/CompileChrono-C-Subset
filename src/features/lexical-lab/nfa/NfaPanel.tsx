import { AutomataGraph } from "../../../components/visualizations/AutomataGraph";
import { runNfaSimulation } from "../../../compiler/automata/simulation/nfaSimulation";
import { useMemo } from "react";
import { useCompilerStore } from "../../../store/compilerStore";

export function NfaPanel() {
  const automata = useCompilerStore((state) => state.automata);
  const input = useCompilerStore((state) => state.simulationInput);
  const simulationStep = useCompilerStore((state) => state.simulationStep);
  const steps = useMemo(() => runNfaSimulation(automata.nfa, input), [automata.nfa, input]);
  const current = steps[Math.min(simulationStep, steps.length - 1)];

  return <AutomataGraph graphId="nfa-main" automaton={automata.nfa} activeStates={current?.nextStates} activeTransitionIds={current?.transitionIds} />;
}

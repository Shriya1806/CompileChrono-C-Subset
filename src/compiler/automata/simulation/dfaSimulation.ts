import type { DFA } from "../models";
import { symbolMatches } from "../models";

export interface DfaSimulationStep {
  index: number;
  char: string | null;
  fromState: string;
  toState: string;
  transitionId: string | null;
  accepted: boolean;
  rejected: boolean;
}

export function nextDfaTransition(dfa: DFA, state: string, char: string) {
  return dfa.transitions.find((transition) => transition.from === state && symbolMatches(transition.symbol, char));
}

export function dfaAccepts(dfa: DFA, input: string): boolean {
  let current = dfa.startState;
  for (const char of input) {
    const transition = nextDfaTransition(dfa, current, char);
    if (!transition) return false;
    current = transition.to;
  }
  return dfa.acceptStates.includes(current);
}

export function runDfaSimulation(dfa: DFA, input: string): DfaSimulationStep[] {
  const steps: DfaSimulationStep[] = [];
  let current = dfa.startState;
  let rejected = false;

  steps.push({
    index: 0,
    char: null,
    fromState: current,
    toState: current,
    transitionId: null,
    accepted: dfa.acceptStates.includes(current),
    rejected: false
  });

  [...input].forEach((char, index) => {
    if (rejected) return;
    const transition = nextDfaTransition(dfa, current, char);
    if (!transition) {
      rejected = true;
      steps.push({
        index: index + 1,
        char,
        fromState: current,
        toState: current,
        transitionId: null,
        accepted: false,
        rejected: true
      });
      return;
    }
    const previous = current;
    current = transition.to;
    steps.push({
      index: index + 1,
      char,
      fromState: previous,
      toState: current,
      transitionId: transition.id,
      accepted: dfa.acceptStates.includes(current),
      rejected: false
    });
  });

  return steps;
}

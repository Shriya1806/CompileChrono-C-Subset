import type { NFA } from "../models";
import { symbolMatches } from "../models";

export interface NfaSimulationStep {
  index: number;
  char: string | null;
  currentStates: string[];
  nextStates: string[];
  transitionIds: string[];
  accepted: boolean;
}

export function epsilonClosure(nfa: NFA, states: Iterable<string>): Set<string> {
  const closure = new Set(states);
  const stack = [...closure];
  while (stack.length > 0) {
    const state = stack.pop()!;
    for (const transition of nfa.transitions) {
      if (transition.from === state && transition.symbol.kind === "epsilon" && !closure.has(transition.to)) {
        closure.add(transition.to);
        stack.push(transition.to);
      }
    }
  }
  return closure;
}

export function move(nfa: NFA, states: Iterable<string>, char: string): { states: Set<string>; transitionIds: string[] } {
  const next = new Set<string>();
  const transitionIds: string[] = [];
  for (const state of states) {
    for (const transition of nfa.transitions) {
      if (transition.from === state && symbolMatches(transition.symbol, char)) {
        next.add(transition.to);
        transitionIds.push(transition.id);
      }
    }
  }
  return { states: next, transitionIds };
}

export function nfaAccepts(nfa: NFA, input: string): boolean {
  let current = epsilonClosure(nfa, [nfa.startState]);
  for (const char of input) {
    const moved = move(nfa, current, char);
    current = epsilonClosure(nfa, moved.states);
  }
  return nfa.acceptStates.some((state) => current.has(state));
}

export function runNfaSimulation(nfa: NFA, input: string): NfaSimulationStep[] {
  const steps: NfaSimulationStep[] = [];
  let current = epsilonClosure(nfa, [nfa.startState]);

  steps.push({
    index: 0,
    char: null,
    currentStates: [...current].sort(),
    nextStates: [...current].sort(),
    transitionIds: [],
    accepted: nfa.acceptStates.some((state) => current.has(state))
  });

  [...input].forEach((char, index) => {
    const moved = move(nfa, current, char);
    const next = epsilonClosure(nfa, moved.states);
    steps.push({
      index: index + 1,
      char,
      currentStates: [...current].sort(),
      nextStates: [...next].sort(),
      transitionIds: moved.transitionIds,
      accepted: nfa.acceptStates.some((state) => next.has(state))
    });
    current = next;
  });

  return steps;
}

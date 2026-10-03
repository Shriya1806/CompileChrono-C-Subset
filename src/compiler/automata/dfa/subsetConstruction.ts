import type { AutomataTransition, DFA, NFA, SubsetConstructionResult } from "../models";
import { charsToLabel, symbolMatches } from "../models";
import { epsilonClosure, move } from "../simulation/nfaSimulation";

const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, index) => String.fromCharCode(index + 32));

function keyOf(states: Iterable<string>): string {
  return [...states].sort().join(",");
}

function labelFor(index: number): string {
  return `D${index}`;
}

export function alphabetForNfa(nfa: NFA): string[] {
  const chars = new Set<string>();
  for (const char of PRINTABLE_ASCII) {
    if (nfa.transitions.some((transition) => symbolMatches(transition.symbol, char))) {
      chars.add(char);
    }
  }
  return [...chars].sort();
}

export function subsetConstruction(nfa: NFA, id = "dfa"): SubsetConstructionResult {
  const alphabet = alphabetForNfa(nfa);
  const startSet = epsilonClosure(nfa, [nfa.startState]);
  const stateMap = new Map<string, string>();
  const dfaStateSets = new Map<string, string[]>();
  const queue: Set<string>[] = [startSet];
  const transitionsByPair = new Map<string, Set<string>>();
  const steps = [];

  stateMap.set(keyOf(startSet), labelFor(0));
  dfaStateSets.set(labelFor(0), [...startSet].sort());

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = keyOf(current);
    const currentDfaState = stateMap.get(currentKey)!;

    for (const symbol of alphabet) {
      const moved = move(nfa, current, symbol);
      const closure = epsilonClosure(nfa, moved.states);
      const targetKey = keyOf(closure);
      if (closure.size === 0) continue;

      let targetDfaState = stateMap.get(targetKey);
      let created = false;
      if (!targetDfaState) {
        targetDfaState = labelFor(stateMap.size);
        stateMap.set(targetKey, targetDfaState);
        dfaStateSets.set(targetDfaState, [...closure].sort());
        queue.push(closure);
        created = true;
      }

      const pairKey = `${currentDfaState}->${targetDfaState}`;
      if (!transitionsByPair.has(pairKey)) transitionsByPair.set(pairKey, new Set());
      transitionsByPair.get(pairKey)!.add(symbol);

      steps.push({
        id: `subset-${steps.length}`,
        dfaState: currentDfaState,
        nfaStates: [...current].sort(),
        symbol,
        targetNfaStates: [...closure].sort(),
        targetDfaState,
        created
      });
    }
  }

  const states = [...dfaStateSets.entries()].map(([stateId, nfaStates]) => ({
    id: stateId,
    label: stateId,
    nfaStates
  }));

  const transitions: AutomataTransition[] = [...transitionsByPair.entries()].map(([pairKey, chars], index) => {
    const [from, to] = pairKey.split("->");
    const charList = [...chars].sort();
    return {
      id: `dt${index}`,
      from,
      to,
      symbol: { kind: "charClass", label: charsToLabel(charList), chars: charList }
    };
  });

  const dfa: DFA = {
    id,
    states,
    transitions,
    startState: labelFor(0),
    acceptStates: states
      .filter((state) => state.nfaStates.some((nfaState) => nfa.acceptStates.includes(nfaState)))
      .map((state) => state.id),
    alphabet
  };

  return { dfa, steps };
}

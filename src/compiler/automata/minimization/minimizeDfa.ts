import type { AutomataTransition, DFA, MinimizationResult, MinimizationStep } from "../models";
import { charsToLabel, symbolMatches } from "../models";

function setKey(states: string[]): string {
  return [...states].sort().join(",");
}

function targetFor(dfa: DFA, state: string, char: string): string | null {
  return dfa.transitions.find((transition) => transition.from === state && symbolMatches(transition.symbol, char))?.to ?? null;
}

function partitionIndex(partitions: string[][], state: string | null): number {
  if (!state) return -1;
  return partitions.findIndex((group) => group.includes(state));
}

export function minimizeDfa(dfa: DFA, id = "min-dfa"): MinimizationResult {
  const accepting = dfa.states.map((state) => state.id).filter((state) => dfa.acceptStates.includes(state));
  const nonAccepting = dfa.states.map((state) => state.id).filter((state) => !dfa.acceptStates.includes(state));
  let partitions = [nonAccepting, accepting].filter((group) => group.length > 0).map((group) => group.sort());
  const steps: MinimizationStep[] = [
    {
      id: "min-0",
      title: "Initial partition",
      partitions,
      description: "Split states into non-final and final groups."
    }
  ];

  let changed = true;
  while (changed) {
    changed = false;
    const nextPartitions: string[][] = [];

    for (const group of partitions) {
      const buckets = new Map<string, string[]>();
      for (const state of group) {
        const signature = dfa.alphabet.map((char) => partitionIndex(partitions, targetFor(dfa, state, char))).join("|");
        if (!buckets.has(signature)) buckets.set(signature, []);
        buckets.get(signature)!.push(state);
      }
      nextPartitions.push(...[...buckets.values()].map((bucket) => bucket.sort()));
      if (buckets.size > 1) changed = true;
    }

    partitions = nextPartitions.sort((a, b) => setKey(a).localeCompare(setKey(b)));
    steps.push({
      id: `min-${steps.length}`,
      title: changed ? "Partition refined" : "Stable partition",
      partitions,
      description: changed
        ? "States with different transition behavior were split into separate equivalence groups."
        : "No partition can be split further; each group represents one minimized DFA state."
    });
  }

  const groupForState = new Map<string, string>();
  partitions.forEach((group, index) => group.forEach((state) => groupForState.set(state, `M${index}`)));
  const transitionBuckets = new Map<string, Set<string>>();

  for (const group of partitions) {
    const representative = group[0];
    const from = groupForState.get(representative)!;
    for (const char of dfa.alphabet) {
      const target = targetFor(dfa, representative, char);
      if (!target) continue;
      const to = groupForState.get(target)!;
      const key = `${from}->${to}`;
      if (!transitionBuckets.has(key)) transitionBuckets.set(key, new Set());
      transitionBuckets.get(key)!.add(char);
    }
  }

  const transitions: AutomataTransition[] = [...transitionBuckets.entries()].map(([key, chars], index) => {
    const [from, to] = key.split("->");
    const charList = [...chars].sort();
    return {
      id: `mt${index}`,
      from,
      to,
      symbol: { kind: "charClass", label: charsToLabel(charList), chars: charList }
    };
  });

  const minimizedDfa: DFA = {
    id,
    states: partitions.map((group, index) => ({
      id: `M${index}`,
      label: `M${index}`,
      nfaStates: group
    })),
    transitions,
    startState: groupForState.get(dfa.startState)!,
    acceptStates: partitions
      .map((group, index) => ({ group, id: `M${index}` }))
      .filter(({ group }) => group.some((state) => dfa.acceptStates.includes(state)))
      .map(({ id }) => id),
    alphabet: dfa.alphabet
  };

  return {
    minimizedDfa,
    steps,
    stateGroups: partitions,
    originalStateCount: dfa.states.length,
    minimizedStateCount: partitions.length
  };
}

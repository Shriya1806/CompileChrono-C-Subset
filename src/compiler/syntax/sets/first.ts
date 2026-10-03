import { EPSILON, type Grammar, type GrammarSymbol } from "../grammar/grammarTypes";

export type FirstSets = Record<string, Set<string>>;

export interface FirstExplanation {
  target: string;
  terminals: string[];
  reasons: string[];
}

export function computeFirstSets(grammar: Grammar): FirstSets {
  const first: FirstSets = {};
  for (const terminal of grammar.terminals) first[terminal] = new Set([terminal]);
  first[EPSILON] = new Set([EPSILON]);
  for (const nonTerminal of grammar.nonTerminals) first[nonTerminal] = new Set();

  let changed = true;
  while (changed) {
    changed = false;
    for (const production of grammar.productions) {
      const before = first[production.lhs].size;
      for (const terminal of firstOfSequence(production.rhs, first)) {
        first[production.lhs].add(terminal);
      }
      if (first[production.lhs].size !== before) changed = true;
    }
  }
  return first;
}

export function firstOfSequence(sequence: GrammarSymbol[], firstSets: FirstSets): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }
  for (const symbol of sequence) {
    const symbolFirst = symbol.kind === "epsilon" ? new Set([EPSILON]) : firstSets[symbol.name] ?? new Set<string>();
    for (const item of symbolFirst) {
      if (item !== EPSILON) result.add(item);
    }
    if (!symbolFirst.has(EPSILON)) return result;
  }
  result.add(EPSILON);
  return result;
}

export function explainFirst(grammar: Grammar, nonTerminal: string, firstSets: FirstSets): FirstExplanation {
  const reasons: string[] = [];
  for (const production of grammar.productions.filter((item) => item.lhs === nonTerminal)) {
    const derived = [...firstOfSequence(production.rhs, firstSets)].sort();
    reasons.push(`${production.id}: ${production.label} contributes { ${derived.join(", ")} }`);
  }
  return {
    target: nonTerminal,
    terminals: [...(firstSets[nonTerminal] ?? new Set())].sort(),
    reasons
  };
}

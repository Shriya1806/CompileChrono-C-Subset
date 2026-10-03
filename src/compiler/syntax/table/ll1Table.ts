import { EPSILON, type Grammar, type Production } from "../grammar/grammarTypes";
import { firstOfSequence, type FirstSets } from "../sets/first";
import type { FollowSets } from "../sets/follow";

export interface LL1Conflict {
  nonTerminal: string;
  terminal: string;
  productions: Production[];
}

export interface LL1ParsingTable {
  cells: Record<string, Record<string, Production>>;
  conflicts: LL1Conflict[];
}

export function buildLL1ParsingTable(grammar: Grammar, firstSets: FirstSets, followSets: FollowSets): LL1ParsingTable {
  const cells: Record<string, Record<string, Production>> = Object.fromEntries(grammar.nonTerminals.map((name) => [name, {}]));
  const conflictMap = new Map<string, Production[]>();

  for (const production of grammar.productions) {
    const firstAlpha = firstOfSequence(production.rhs, firstSets);
    const targets = new Set([...firstAlpha].filter((item) => item !== EPSILON));
    if (firstAlpha.has(EPSILON)) {
      for (const terminal of followSets[production.lhs] ?? []) targets.add(terminal);
    }
    for (const terminal of targets) {
      const existing = cells[production.lhs][terminal];
      if (existing && existing.id !== production.id) {
        const key = `${production.lhs}:${terminal}`;
        conflictMap.set(key, [...(conflictMap.get(key) ?? [existing]), production]);
      } else {
        cells[production.lhs][terminal] = production;
      }
    }
  }

  return {
    cells,
    conflicts: [...conflictMap.entries()].map(([key, productions]) => {
      const [nonTerminal, terminal] = key.split(":");
      return { nonTerminal, terminal, productions };
    })
  };
}

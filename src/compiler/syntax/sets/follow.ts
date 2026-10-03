import { EOF_SYMBOL, EPSILON, type Grammar } from "../grammar/grammarTypes";
import { firstOfSequence, type FirstSets } from "./first";

export type FollowSets = Record<string, Set<string>>;

export interface FollowExplanation {
  target: string;
  terminals: string[];
  reasons: string[];
}

export function computeFollowSets(grammar: Grammar, firstSets: FirstSets): FollowSets {
  const follow: FollowSets = Object.fromEntries(grammar.nonTerminals.map((name) => [name, new Set<string>()]));
  follow[grammar.startSymbol].add(EOF_SYMBOL);

  let changed = true;
  while (changed) {
    changed = false;
    for (const production of grammar.productions) {
      for (let index = 0; index < production.rhs.length; index++) {
        const symbol = production.rhs[index];
        if (symbol.kind !== "nonTerminal") continue;
        const beta = production.rhs.slice(index + 1);
        const firstBeta = firstOfSequence(beta, firstSets);
        const before = follow[symbol.name].size;
        for (const terminal of firstBeta) {
          if (terminal !== EPSILON) follow[symbol.name].add(terminal);
        }
        if (beta.length === 0 || firstBeta.has(EPSILON)) {
          for (const terminal of follow[production.lhs]) follow[symbol.name].add(terminal);
        }
        if (follow[symbol.name].size !== before) changed = true;
      }
    }
  }

  return follow;
}

export function explainFollow(grammar: Grammar, nonTerminal: string, followSets: FollowSets): FollowExplanation {
  const reasons: string[] = [];
  if (nonTerminal === grammar.startSymbol) reasons.push(`${EOF_SYMBOL} is included because ${nonTerminal} is the start symbol.`);
  for (const production of grammar.productions) {
    production.rhs.forEach((symbol, index) => {
      if (symbol.kind === "nonTerminal" && symbol.name === nonTerminal) {
        const beta = production.rhs.slice(index + 1).map((item) => item.name).join(" ") || "epsilon";
        reasons.push(`${production.id}: ${production.label}; symbols after ${nonTerminal}: ${beta}`);
      }
    });
  }
  return {
    target: nonTerminal,
    terminals: [...(followSets[nonTerminal] ?? new Set())].sort(),
    reasons
  };
}

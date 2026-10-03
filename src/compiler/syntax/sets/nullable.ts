import type { Grammar } from "../grammar/grammarTypes";

export type NullableSets = Record<string, boolean>;

export function computeNullable(grammar: Grammar): NullableSets {
  const nullable: NullableSets = Object.fromEntries(grammar.nonTerminals.map((name) => [name, false]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const production of grammar.productions) {
      const rhsNullable = production.rhs.every((symbol) => {
        if (symbol.kind === "epsilon") return true;
        if (symbol.kind === "terminal") return false;
        return nullable[symbol.name];
      });
      if (rhsNullable && !nullable[production.lhs]) {
        nullable[production.lhs] = true;
        changed = true;
      }
    }
  }
  return nullable;
}

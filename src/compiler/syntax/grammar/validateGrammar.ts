import { EPSILON, type Grammar, type GrammarDiagnostic } from "./grammarTypes";

export function validateGrammar(grammar: Grammar): GrammarDiagnostic[] {
  const diagnostics: GrammarDiagnostic[] = [];
  const nonTerminalSet = new Set(grammar.nonTerminals);
  const terminalSet = new Set(grammar.terminals);
  const productionKeys = new Set<string>();

  for (const production of grammar.productions) {
    if (!nonTerminalSet.has(production.lhs)) {
      diagnostics.push({ severity: "error", message: `Undefined LHS non-terminal ${production.lhs}.`, productionId: production.id, symbol: production.lhs });
    }
    if (production.rhs.length === 0) {
      diagnostics.push({ severity: "error", message: "Production has an accidental empty RHS; use EPSILON explicitly.", productionId: production.id });
    }
    const key = `${production.lhs}->${production.rhs.map((symbol) => symbol.name).join(" ")}`;
    if (productionKeys.has(key)) {
      diagnostics.push({ severity: "warning", message: "Duplicate production.", productionId: production.id });
    }
    productionKeys.add(key);
    if (production.rhs[0]?.kind === "nonTerminal" && production.rhs[0].name === production.lhs) {
      diagnostics.push({ severity: "error", message: "Direct left recursion detected.", productionId: production.id, symbol: production.lhs });
    }
    for (const symbol of production.rhs) {
      if (symbol.kind === "epsilon" && production.rhs.length > 1) {
        diagnostics.push({ severity: "error", message: "EPSILON must be the only RHS symbol.", productionId: production.id });
      }
      if (symbol.kind === "nonTerminal" && !nonTerminalSet.has(symbol.name)) {
        diagnostics.push({ severity: "error", message: `Undefined non-terminal ${symbol.name}.`, productionId: production.id, symbol: symbol.name });
      }
      if (symbol.kind === "terminal" && !terminalSet.has(symbol.name)) {
        diagnostics.push({ severity: "error", message: `Undefined terminal ${symbol.name}.`, productionId: production.id, symbol: symbol.name });
      }
      if (symbol.name === EPSILON && symbol.kind !== "epsilon") {
        diagnostics.push({ severity: "error", message: "EPSILON must use epsilon symbol kind.", productionId: production.id });
      }
    }
  }

  const reachable = new Set<string>([grammar.startSymbol]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const production of grammar.productions) {
      if (!reachable.has(production.lhs)) continue;
      for (const symbol of production.rhs) {
        if (symbol.kind === "nonTerminal" && !reachable.has(symbol.name)) {
          reachable.add(symbol.name);
          changed = true;
        }
      }
    }
  }
  for (const nonTerminal of grammar.nonTerminals) {
    if (!reachable.has(nonTerminal)) {
      diagnostics.push({ severity: "warning", message: `Unreachable non-terminal ${nonTerminal}.`, symbol: nonTerminal });
    }
  }

  for (const start of grammar.nonTerminals) {
    const seen = new Set<string>();
    if (hasIndirectLeftRecursion(grammar, start, start, seen)) {
      diagnostics.push({ severity: "warning", message: `Possible indirect left recursion involving ${start}.`, symbol: start });
    }
  }

  return diagnostics;
}

function hasIndirectLeftRecursion(grammar: Grammar, start: string, current: string, seen: Set<string>): boolean {
  if (seen.has(current)) return false;
  seen.add(current);
  for (const production of grammar.productions.filter((item) => item.lhs === current)) {
    const first = production.rhs[0];
    if (first?.kind !== "nonTerminal") continue;
    if (first.name === start && current !== start) return true;
    if (hasIndirectLeftRecursion(grammar, start, first.name, seen)) return true;
  }
  return false;
}

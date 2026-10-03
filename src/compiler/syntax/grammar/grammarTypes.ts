export const EPSILON = "EPSILON";
export const EOF_SYMBOL = "EOF";

export type SymbolKind = "terminal" | "nonTerminal" | "epsilon";

export interface GrammarSymbol {
  kind: SymbolKind;
  name: string;
}

export interface Production {
  id: string;
  lhs: string;
  rhs: GrammarSymbol[];
  label?: string;
}

export interface Grammar {
  startSymbol: string;
  nonTerminals: string[];
  terminals: string[];
  productions: Production[];
}

export interface GrammarDiagnostic {
  severity: "error" | "warning";
  message: string;
  productionId?: string;
  symbol?: string;
}

export const T = (name: string): GrammarSymbol => ({ kind: "terminal", name });
export const N = (name: string): GrammarSymbol => ({ kind: "nonTerminal", name });
export const E: GrammarSymbol = { kind: "epsilon", name: EPSILON };

export function symbolText(symbol: GrammarSymbol): string {
  return symbol.kind === "epsilon" ? "epsilon" : symbol.name;
}

export function productionText(production: Production): string {
  return `${production.lhs} -> ${production.rhs.map(symbolText).join(" ")}`;
}

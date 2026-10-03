import type { RegexNode } from "./regex/regexAst";

export type TransitionSymbol =
  | { kind: "epsilon"; label: "epsilon" }
  | { kind: "literal"; value: string; label: string }
  | { kind: "charClass"; label: string; chars?: string[]; ranges?: Array<[string, string]>; negate?: boolean };

export interface AutomataState {
  id: string;
  label: string;
}

export interface AutomataTransition {
  id: string;
  from: string;
  to: string;
  symbol: TransitionSymbol;
}

export interface NFA {
  id: string;
  regex: RegexNode;
  states: AutomataState[];
  transitions: AutomataTransition[];
  startState: string;
  acceptStates: string[];
}

export interface DFAState extends AutomataState {
  nfaStates: string[];
}

export interface DFA {
  id: string;
  states: DFAState[];
  transitions: AutomataTransition[];
  startState: string;
  acceptStates: string[];
  alphabet: string[];
}

export interface SubsetConstructionStep {
  id: string;
  dfaState: string;
  nfaStates: string[];
  symbol: string;
  targetNfaStates: string[];
  targetDfaState: string | null;
  created: boolean;
}

export interface SubsetConstructionResult {
  dfa: DFA;
  steps: SubsetConstructionStep[];
}

export interface MinimizationStep {
  id: string;
  title: string;
  partitions: string[][];
  description: string;
}

export interface MinimizationResult {
  minimizedDfa: DFA;
  steps: MinimizationStep[];
  stateGroups: string[][];
  originalStateCount: number;
  minimizedStateCount: number;
}

export const EPSILON: TransitionSymbol = { kind: "epsilon", label: "epsilon" };

export function transitionLabel(symbol: TransitionSymbol): string {
  return symbol.label;
}

export function symbolMatches(symbol: TransitionSymbol, char: string): boolean {
  if (symbol.kind === "epsilon") return false;
  if (symbol.kind === "literal") return symbol.value === char;

  let matched = false;
  if (symbol.chars?.includes(char)) matched = true;
  if (symbol.ranges) {
    const code = char.charCodeAt(0);
    matched ||= symbol.ranges.some(([start, end]) => code >= start.charCodeAt(0) && code <= end.charCodeAt(0));
  }
  return symbol.negate ? !matched : matched;
}

export function charsToLabel(chars: string[]): string {
  if (chars.length === 1) return printable(chars[0]);
  const sorted = [...chars].sort();
  const ranges: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index <= sorted.length; index++) {
    const current = sorted[index];
    if (current && current.charCodeAt(0) === previous.charCodeAt(0) + 1) {
      previous = current;
      continue;
    }
    ranges.push(start === previous ? printable(start) : `${printable(start)}-${printable(previous)}`);
    start = current;
    previous = current;
  }

  return `[${ranges.join("")}]`;
}

function printable(char: string): string {
  if (char === " ") return "space";
  if (char === "\t") return "\\t";
  if (char === "\n") return "\\n";
  return /[A-Za-z0-9_]/.test(char) ? char : `\\${char}`;
}

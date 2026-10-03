import { describe, expect, it } from "vitest";
import { buildAutomataForRule } from "../compiler/automata/buildAutomataForRule";
import { dfaAccepts } from "../compiler/automata/simulation/dfaSimulation";
import { nfaAccepts } from "../compiler/automata/simulation/nfaSimulation";
import { getLexicalRule } from "../compiler/language/lexicalRules";

describe("automata algorithms", () => {
  it("builds a valid Thompson NFA for identifiers", () => {
    const rule = getLexicalRule("identifier");
    const { nfa } = buildAutomataForRule(rule);
    expect(nfa.states.length).toBeGreaterThan(0);
    expect(nfa.transitions.length).toBeGreaterThan(0);
    expect(nfaAccepts(nfa, "value123")).toBe(true);
    expect(nfaAccepts(nfa, "123value")).toBe(false);
  });

  it("converts NFA to DFA with equivalent acceptance on representative strings", () => {
    const { nfa, dfa } = buildAutomataForRule(getLexicalRule("identifier"));
    for (const input of ["a", "_x", "value123", "A9_"]) {
      expect(dfaAccepts(dfa, input)).toBe(nfaAccepts(nfa, input));
    }
    for (const input of ["", "1a", "-bad"]) {
      expect(dfaAccepts(dfa, input)).toBe(nfaAccepts(nfa, input));
    }
  });

  it("minimizes DFA while preserving acceptance", () => {
    const { dfa, minimizedDfa, minimization } = buildAutomataForRule(getLexicalRule("identifier"));
    expect(minimization.minimizedStateCount).toBeLessThanOrEqual(minimization.originalStateCount);
    for (const input of ["abc", "_", "x9", "9x", ""]) {
      expect(dfaAccepts(minimizedDfa, input)).toBe(dfaAccepts(dfa, input));
    }
  });

  it("supports decimal literals through all automata stages", () => {
    const { nfa, dfa, minimizedDfa } = buildAutomataForRule(getLexicalRule("decimal"));
    expect(nfaAccepts(nfa, "10.5")).toBe(true);
    expect(dfaAccepts(dfa, "10.5")).toBe(true);
    expect(dfaAccepts(minimizedDfa, "10.5")).toBe(true);
    expect(dfaAccepts(minimizedDfa, "10.")).toBe(false);
  });
});

import type { LexicalRule } from "../language/lexicalRules";
import { regexToNfa } from "./nfa/thompson";
import { subsetConstruction } from "./dfa/subsetConstruction";
import { minimizeDfa } from "./minimization/minimizeDfa";

export function buildAutomataForRule(rule: LexicalRule) {
  const nfa = regexToNfa(rule.regex, `${rule.id}-nfa`);
  const subset = subsetConstruction(nfa, `${rule.id}-dfa`);
  const minimization = minimizeDfa(subset.dfa, `${rule.id}-min-dfa`);
  return {
    nfa,
    dfa: subset.dfa,
    subsetSteps: subset.steps,
    minimization,
    minimizedDfa: minimization.minimizedDfa
  };
}

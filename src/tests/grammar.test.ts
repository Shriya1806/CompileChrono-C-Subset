import { describe, expect, it } from "vitest";
import { E, N, T, type Grammar } from "../compiler/syntax/grammar/grammarTypes";
import { validateGrammar } from "../compiler/syntax/grammar/validateGrammar";
import { computeNullable } from "../compiler/syntax/sets/nullable";
import { computeFirstSets, firstOfSequence } from "../compiler/syntax/sets/first";
import { computeFollowSets } from "../compiler/syntax/sets/follow";
import { buildLL1ParsingTable } from "../compiler/syntax/table/ll1Table";
import { miniGrammar } from "../compiler/syntax/grammar/miniGrammar";

const expressionGrammar: Grammar = {
  startSymbol: "E",
  nonTerminals: ["E", "EPrime", "T"],
  terminals: ["id", "+", "EOF"],
  productions: [
    { id: "S1", lhs: "E", rhs: [N("T"), N("EPrime")] },
    { id: "S2", lhs: "EPrime", rhs: [T("+"), N("T"), N("EPrime")] },
    { id: "S3", lhs: "EPrime", rhs: [E] },
    { id: "S4", lhs: "T", rhs: [T("id")] }
  ]
};

describe("grammar algorithms", () => {
  it("validates the mini grammar without errors", () => {
    expect(validateGrammar(miniGrammar).filter((diagnostic) => diagnostic.severity === "error")).toHaveLength(0);
  });

  it("computes nullable non-terminals", () => {
    const nullable = computeNullable(expressionGrammar);
    expect(nullable.EPrime).toBe(true);
    expect(nullable.E).toBe(false);
  });

  it("computes FIRST sets and FIRST of sequence", () => {
    const first = computeFirstSets(expressionGrammar);
    expect([...first.E].sort()).toEqual(["id"]);
    expect([...first.EPrime].sort()).toEqual(["+", "EPSILON"]);
    expect([...firstOfSequence([N("EPrime"), T("EOF")], first)].sort()).toEqual(["+", "EOF"]);
  });

  it("computes FOLLOW sets", () => {
    const first = computeFirstSets(expressionGrammar);
    const follow = computeFollowSets(expressionGrammar, first);
    expect([...follow.E].sort()).toEqual(["EOF"]);
    expect([...follow.T].sort()).toEqual(["+", "EOF"]);
  });

  it("builds LL(1) table entries and reports conflicts", () => {
    const first = computeFirstSets(expressionGrammar);
    const follow = computeFollowSets(expressionGrammar, first);
    const table = buildLL1ParsingTable(expressionGrammar, first, follow);
    expect(table.conflicts).toHaveLength(0);
    expect(table.cells.E["id"].id).toBe("S1");
    expect(table.cells.EPrime["+"].id).toBe("S2");
    expect(table.cells.EPrime.EOF.id).toBe("S3");
  });
});

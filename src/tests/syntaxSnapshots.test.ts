import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";
import { CompilerEventType, CompilerPhase } from "../compiler/snapshots/compilerEvent";

describe("syntax snapshots", () => {
  it("records syntax-phase parser snapshots with table and stack metadata", () => {
    const result = compileSource("num a = 10; show(a);");
    const syntaxSnapshots = result.snapshots.filter((snapshot) => snapshot.phase === CompilerPhase.SYNTAX);
    expect(syntaxSnapshots.length).toBeGreaterThan(10);
    expect(syntaxSnapshots.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.FIRST_COMPUTED);
    expect(syntaxSnapshots.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.FOLLOW_COMPUTED);
    expect(syntaxSnapshots.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.PARSING_TABLE_READY);
    expect(syntaxSnapshots.some((snapshot) => snapshot.metadata && "parserStep" in snapshot.metadata)).toBe(true);
    expect(() => JSON.stringify(syntaxSnapshots)).not.toThrow();
  });
});

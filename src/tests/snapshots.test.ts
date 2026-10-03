import { describe, expect, it } from "vitest";
import { lex } from "../compiler/lexer/lexer";
import { CompilerEventType, CompilerPhase } from "../compiler/snapshots/compilerEvent";

describe("compiler snapshots", () => {
  it("records ordered lexical events as serializable snapshots", () => {
    const result = lex("num result = value123 + 20;");
    expect(result.snapshots.length).toBeGreaterThan(8);
    expect(result.snapshots[0]).toMatchObject({ phase: CompilerPhase.SOURCE, step: 0 });
    expect(result.events.map((event) => event.type)).toContain(CompilerEventType.TOKEN_RECOGNIZED);
    expect(result.snapshots.map((snapshot) => snapshot.order)).toEqual(result.snapshots.map((_, index) => index));
    expect(() => JSON.stringify(result.snapshots)).not.toThrow();
  });
});

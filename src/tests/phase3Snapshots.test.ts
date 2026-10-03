import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";
import { CompilerEventType, CompilerPhase } from "../compiler/snapshots/compilerEvent";

describe("phase 3 snapshots", () => {
  it("records semantic and IR snapshots", () => {
    const result = compileSource("num a = 10; num b = 20; num result = a + b * 2; show(result);");
    expect(result.allErrors).toHaveLength(0);
    const semantic = result.snapshots.filter((snapshot) => snapshot.phase === CompilerPhase.SEMANTIC);
    const ir = result.snapshots.filter((snapshot) => snapshot.phase === CompilerPhase.IR);
    expect(semantic.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.SYMBOL_DECLARED);
    expect(semantic.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.TYPE_CHECK_PASSED);
    expect(ir.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.TEMP_CREATED);
    expect(ir.map((snapshot) => snapshot.event.type)).toContain(CompilerEventType.IR_INSTRUCTION_EMITTED);
    expect(() => JSON.stringify([...semantic, ...ir])).not.toThrow();
  });
});

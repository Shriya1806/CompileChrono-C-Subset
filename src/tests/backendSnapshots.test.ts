import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";
import { CompilerEventType, CompilerPhase } from "../compiler/snapshots/compilerEvent";

describe("phase 4 snapshots", () => {
  it("records backend, codegen, machine optimization, and target snapshots", () => {
    const result = compileSource("num a = 10; num b = 20; num result = a + b * 2; show(result);");
    expect(result.allErrors).toHaveLength(0);
    expect(result.snapshots.some((snapshot) => snapshot.event.type === CompilerEventType.BASIC_BLOCKS_CONSTRUCTED)).toBe(true);
    expect(result.snapshots.some((snapshot) => snapshot.event.type === CompilerEventType.CFG_CONSTRUCTED)).toBe(true);
    expect(result.snapshots.some((snapshot) => snapshot.phase === CompilerPhase.MACHINE_INDEPENDENT_OPTIMIZATION)).toBe(true);
    expect(result.snapshots.some((snapshot) => snapshot.phase === CompilerPhase.CODE_GENERATION)).toBe(true);
    expect(result.snapshots.some((snapshot) => snapshot.phase === CompilerPhase.MACHINE_DEPENDENT_OPTIMIZATION)).toBe(true);
    expect(result.snapshots.some((snapshot) => snapshot.phase === CompilerPhase.TARGET)).toBe(true);
    expect(() => JSON.stringify(result.snapshots)).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";
import { buildBasicBlocks, identifyLeaders } from "../compiler/backend/basicBlocks";
import { buildControlFlowGraph } from "../compiler/backend/cfg";
import { optimizeIr } from "../compiler/backend/optimization/optimizer";
import { generateTarget } from "../compiler/backend/target/codeGenerator";
import { optimizeTarget } from "../compiler/backend/target/peephole";
import type { IrInstruction } from "../compiler/ir/irTypes";
import type { TargetInstruction } from "../compiler/backend/target/targetTypes";

describe("phase 4 backend", () => {
  it("identifies leaders and builds basic blocks for branches", () => {
    const result = compileSource(`num age = 20;
if age >= 18 {
    show("Eligible");
} else {
    show("Not Eligible");
}`);
    expect(result.allErrors).toHaveLength(0);
    const ir = result.ir!.instructions;
    const leaders = [...identifyLeaders(ir)];
    const blocks = buildBasicBlocks(ir);
    expect(leaders[0]).toBe(0);
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    expect(blocks.some((block) => block.instructions.some((instruction) => instruction.kind === "IF_FALSE_GOTO"))).toBe(true);
  });

  it("constructs CFG branch and back edges", () => {
    const result = compileSource(`num count = 0;
while count < 5 {
    show(count);
    count = count + 1;
}`);
    expect(result.allErrors).toHaveLength(0);
    const cfg = buildControlFlowGraph(result.ir!.instructions);
    expect(cfg.edges.some((edge) => edge.type === "FALSE_BRANCH")).toBe(true);
    expect(cfg.edges.some((edge) => edge.type === "BACK_EDGE")).toBe(true);
    expect(cfg.entryBlockId).toBe("B1");
  });

  it("runs optimization passes and keeps an immutable optimized IR", () => {
    const ir: IrInstruction[] = [
      instruction("IR_001", "BINARY", "t1 = 10 + 20", { op: "+", arg1: "10", arg2: "20", result: "t1" }),
      instruction("IR_002", "ASSIGN", "a = t1", { arg1: "t1", result: "a" }),
      instruction("IR_003", "BINARY", "t2 = a * 1", { op: "*", arg1: "a", arg2: "1", result: "t2" }),
      instruction("IR_004", "ASSIGN", "b = t2", { arg1: "t2", result: "b" }),
      instruction("IR_005", "ASSIGN", "unused = 100", { arg1: "100", result: "unused" }),
      instruction("IR_006", "PARAM", "param b", { arg1: "b" }),
      instruction("IR_007", "CALL", "call show, 1", { functionName: "show", argumentCount: 1 })
    ];
    const result = optimizeIr(ir);
    expect(result.originalIR.map((item) => item.text)).toContain("t1 = 10 + 20");
    expect(result.events.some((event) => event.type === "CONSTANT_FOLDED")).toBe(true);
    expect(result.events.some((event) => event.type === "ALGEBRAIC_SIMPLIFIED")).toBe(true);
    expect(result.events.some((event) => event.type === "DEAD_CODE_REMOVED")).toBe(true);
    expect(result.optimizedIR.map((item) => item.text)).not.toContain("unused = 100");
  });

  it("generates target code and register events", () => {
    const result = compileSource("num a = 10; num b = 20; num result = a + b * 2; show(result);");
    expect(result.allErrors).toHaveLength(0);
    expect(result.backend?.target.targetInstructions.some((instruction) => instruction.opcode === "STORE")).toBe(true);
    expect(result.backend?.target.events.some((event) => event.type === "REGISTER_ALLOCATED")).toBe(true);
    expect(result.backend?.machineOptimization.finalTarget.length).toBeGreaterThan(0);
  });

  it("peephole optimizer removes no-ops and jump-to-next-label", () => {
    const program = generateTarget([
      instruction("IR_001", "ASSIGN", "x = 10", { arg1: "10", result: "x" }),
      { ...instruction("IR_002", "LABEL", "L1:", {}), label: "L1" }
    ]);
    const withNoops: TargetInstruction[] = [
      ...program.targetInstructions,
      { id: "TGT_X", opcode: "MOV", operands: [{ kind: "REGISTER", value: "R1" }, { kind: "REGISTER", value: "R1" }], sourceIrIds: [], text: "MOV R1, R1" },
      { id: "TGT_Y", opcode: "ADD", operands: [{ kind: "REGISTER", value: "R1" }, { kind: "IMMEDIATE", value: "0" }], sourceIrIds: [], text: "ADD R1, #0" }
    ];
    const optimized = optimizeTarget(withNoops);
    expect(optimized.finalTarget.map((item) => item.text)).not.toContain("MOV R1, R1");
    expect(optimized.finalTarget.map((item) => item.text)).not.toContain("ADD R1, #0");
  });
});

function instruction(id: string, kind: IrInstruction["kind"], text: string, patch: Partial<IrInstruction>): IrInstruction {
  return { id, kind, text, ...patch };
}

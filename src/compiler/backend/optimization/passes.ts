import type { IrInstruction } from "../../ir/irTypes";
import { buildControlFlowGraph, reachableBlocks } from "../cfg";
import { isConstant, isName } from "../dataFlow";
import type { OptimizationPass } from "./optimizationTypes";

function replaceInstruction(instruction: IrInstruction, patch: Partial<IrInstruction>): IrInstruction {
  const next = { ...instruction, ...patch };
  return { ...next, text: render(next) };
}

function render(instruction: IrInstruction) {
  if (instruction.kind === "ASSIGN") return `${instruction.result} = ${instruction.arg1}`;
  if (instruction.kind === "BINARY") return `${instruction.result} = ${instruction.arg1} ${instruction.op} ${instruction.arg2}`;
  if (instruction.kind === "UNARY") return `${instruction.result} = ${instruction.op}${instruction.arg1}`;
  return instruction.text;
}

function valueOf(value?: string): string | number | boolean | null {
  if (!value) return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^".*"$/.test(value)) return value.slice(1, -1);
  return null;
}

function fold(op: string | undefined, left?: string, right?: string): string | null {
  const a = valueOf(left);
  const b = valueOf(right);
  if (a === null || b === null || op === undefined) return null;
  if (typeof a === "number" && typeof b === "number") {
    if (op === "+") return String(a + b);
    if (op === "-") return String(a - b);
    if (op === "*") return String(a * b);
    if (op === "/" && b !== 0) return String(a / b);
    if (op === "%" && b !== 0) return String(a % b);
    if (op === "<") return String(a < b);
    if (op === "<=") return String(a <= b);
    if (op === ">") return String(a > b);
    if (op === ">=") return String(a >= b);
    if (op === "==") return String(a === b);
    if (op === "!=") return String(a !== b);
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    if (op === "&&") return String(a && b);
    if (op === "||") return String(a || b);
    if (op === "==") return String(a === b);
    if (op === "!=") return String(a !== b);
  }
  if (typeof a === "string" && typeof b === "string" && op === "+") return `"${a + b}"`;
  return null;
}

export const constantFoldingPass: OptimizationPass = {
  id: "constant-folding",
  name: "Constant Folding",
  description: "Evaluate constant expressions when both operands are known literals.",
  apply(ir, emit) {
    let changed = false;
    let count = 0;
    const next = ir.map((instruction) => {
      if (instruction.kind !== "BINARY") return instruction;
      const folded = fold(instruction.op, instruction.arg1, instruction.arg2);
      if (folded === null) return instruction;
      const replacement = replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1: folded, arg2: undefined });
      changed = true;
      count += 1;
      emit({ type: "CONSTANT_FOLDED", passId: "constant-folding", instructionIds: [instruction.id], before: instruction.text, after: replacement.text, reason: "Both operands are constants." }, nextWith(ir, instruction.id, replacement));
      return replacement;
    });
    return { changed, optimizedIR: next, statistics: { folded: count } };
  }
};

export const constantPropagationPass: OptimizationPass = {
  id: "constant-propagation",
  name: "Constant Propagation",
  description: "Replace local uses with known constant values.",
  apply(ir, emit) {
    const constants = new Map<string, string>();
    let changed = false;
    let count = 0;
    const next = ir.map((instruction) => {
      let current = instruction;
      if (current.arg1 && constants.has(current.arg1)) current = replaceInstruction(current, { arg1: constants.get(current.arg1) });
      if (current.arg2 && constants.has(current.arg2)) current = replaceInstruction(current, { arg2: constants.get(current.arg2) });
      if (current.text !== instruction.text) {
        changed = true;
        count += 1;
        emit({ type: "CONSTANT_PROPAGATED", passId: "constant-propagation", instructionIds: [instruction.id], before: instruction.text, after: current.text, reason: "Operand replaced with known constant." }, nextWith(ir, instruction.id, current));
      }
      if (current.result) constants.delete(current.result);
      if (current.kind === "ASSIGN" && current.result && isConstant(current.arg1)) constants.set(current.result, current.arg1!);
      if (current.kind !== "ASSIGN" && current.result) constants.delete(current.result);
      if (current.kind === "LABEL" || current.kind === "GOTO" || current.kind === "IF_FALSE_GOTO") constants.clear();
      return current;
    });
    return { changed, optimizedIR: next, statistics: { propagated: count } };
  }
};

export const copyPropagationPass: OptimizationPass = {
  id: "copy-propagation",
  name: "Copy Propagation",
  description: "Replace uses of local copies when still valid.",
  apply(ir, emit) {
    const copies = new Map<string, string>();
    let changed = false;
    let count = 0;
    const next = ir.map((instruction) => {
      let current = instruction;
      if (current.arg1 && copies.has(current.arg1)) current = replaceInstruction(current, { arg1: copies.get(current.arg1) });
      if (current.arg2 && copies.has(current.arg2)) current = replaceInstruction(current, { arg2: copies.get(current.arg2) });
      if (current.text !== instruction.text) {
        changed = true;
        count += 1;
        emit({ type: "COPY_PROPAGATED", passId: "copy-propagation", instructionIds: [instruction.id], before: instruction.text, after: current.text, reason: "Operand replaced with copy source." }, nextWith(ir, instruction.id, current));
      }
      if (current.result) {
        copies.delete(current.result);
        for (const [name, source] of [...copies]) if (source === current.result) copies.delete(name);
      }
      if (current.kind === "ASSIGN" && current.result && current.arg1 && isName(current.arg1)) copies.set(current.result, current.arg1);
      if (current.kind === "LABEL" || current.kind === "GOTO" || current.kind === "IF_FALSE_GOTO") copies.clear();
      return current;
    });
    return { changed, optimizedIR: next, statistics: { copyPropagated: count } };
  }
};

export const algebraicSimplificationPass: OptimizationPass = {
  id: "algebraic-simplification",
  name: "Algebraic Simplification",
  description: "Apply safe algebraic identities.",
  apply(ir, emit) {
    let changed = false;
    let count = 0;
    const next = ir.map((instruction) => {
      if (instruction.kind !== "BINARY") return instruction;
      const simplified = simplify(instruction);
      if (!simplified) return instruction;
      changed = true;
      count += 1;
      emit({ type: "ALGEBRAIC_SIMPLIFIED", passId: "algebraic-simplification", instructionIds: [instruction.id], before: instruction.text, after: simplified.text, reason: "Safe algebraic identity." }, nextWith(ir, instruction.id, simplified));
      return simplified;
    });
    return { changed, optimizedIR: next, statistics: { simplified: count } };
  }
};

function simplify(instruction: IrInstruction): IrInstruction | null {
  const { op, arg1, arg2 } = instruction;
  if ((op === "+" || op === "-") && arg2 === "0") return replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1, arg2: undefined });
  if (op === "+" && arg1 === "0") return replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1: arg2, arg2: undefined });
  if ((op === "*" || op === "/") && arg2 === "1") return replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1, arg2: undefined });
  if (op === "*" && arg1 === "1") return replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1: arg2, arg2: undefined });
  if (op === "*" && (arg1 === "0" || arg2 === "0")) return replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1: "0", arg2: undefined });
  return null;
}

export const csePass: OptimizationPass = {
  id: "local-cse",
  name: "Local Common Subexpression Elimination",
  description: "Reuse repeated expressions within a basic block.",
  apply(ir, emit) {
    const expressions = new Map<string, string>();
    let changed = false;
    let count = 0;
    const next = ir.map((instruction) => {
      if (instruction.kind === "LABEL" || instruction.kind === "GOTO" || instruction.kind === "IF_FALSE_GOTO") expressions.clear();
      if (instruction.result) {
        for (const [expr, result] of [...expressions]) if (expr.includes(`|${instruction.result}|`) || result === instruction.result) expressions.delete(expr);
      }
      if (instruction.kind !== "BINARY" || !instruction.result) return instruction;
      const key = `${instruction.op}|${instruction.arg1}|${instruction.arg2}`;
      const previous = expressions.get(key);
      if (previous) {
        const replacement = replaceInstruction(instruction, { kind: "ASSIGN", op: undefined, arg1: previous, arg2: undefined });
        changed = true;
        count += 1;
        emit({ type: "COMMON_SUBEXPRESSION_REUSED", passId: "local-cse", instructionIds: [instruction.id], before: instruction.text, after: replacement.text, reason: "Expression already computed in this block." }, nextWith(ir, instruction.id, replacement));
        return replacement;
      }
      expressions.set(key, instruction.result);
      return instruction;
    });
    return { changed, optimizedIR: next, statistics: { reused: count } };
  }
};

export const deadCodeEliminationPass: OptimizationPass = {
  id: "dead-code-elimination",
  name: "Dead Code Elimination",
  description: "Remove unused pure assignments and temporary computations.",
  apply(ir, emit) {
    const live = new Set<string>();
    const keep: IrInstruction[] = [];
    let removed = 0;
    for (let index = ir.length - 1; index >= 0; index--) {
      const instruction = ir[index];
      const sideEffect = ["PARAM", "CALL", "RETURN", "GOTO", "IF_FALSE_GOTO", "LABEL", "FUNCTION_START", "FUNCTION_END"].includes(instruction.kind);
      const result = instruction.result;
      if (result && !live.has(result) && !sideEffect) {
        removed += 1;
        emit({ type: "DEAD_CODE_REMOVED", passId: "dead-code-elimination", instructionIds: [instruction.id], before: instruction.text, reason: "Defined value is never used." }, keep.slice().reverse());
        continue;
      }
      if (result) live.delete(result);
      for (const value of [instruction.arg1, instruction.arg2]) if (value && isName(value)) live.add(value);
      keep.push(instruction);
    }
    return { changed: removed > 0, optimizedIR: keep.reverse(), statistics: { removed } };
  }
};

export const unreachableCodeEliminationPass: OptimizationPass = {
  id: "unreachable-code-elimination",
  name: "Unreachable Code Elimination",
  description: "Remove blocks not reachable from the CFG entry.",
  apply(ir, emit) {
    if (ir.some((instruction) => instruction.kind === "FUNCTION_START")) {
      return { changed: false, optimizedIR: ir, statistics: { unreachableRemoved: 0 } };
    }
    const cfg = buildControlFlowGraph(ir);
    const reachable = reachableBlocks(cfg);
    const reachableIds = new Set(cfg.nodes.filter((block) => reachable.has(block.id)).flatMap((block) => block.instructions.map((instruction) => instruction.id)));
    const next = ir.filter((instruction) => reachableIds.has(instruction.id));
    const removed = ir.length - next.length;
    if (removed > 0) emit({ type: "UNREACHABLE_CODE_REMOVED", passId: "unreachable-code-elimination", reason: `${removed} instruction(s) in unreachable blocks removed.` }, next);
    return { changed: removed > 0, optimizedIR: next, statistics: { unreachableRemoved: removed } };
  }
};

function nextWith(ir: IrInstruction[], id: string, replacement: IrInstruction) {
  return ir.map((instruction) => (instruction.id === id ? replacement : instruction));
}

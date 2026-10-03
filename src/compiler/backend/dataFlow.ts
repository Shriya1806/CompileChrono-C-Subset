import type { IrInstruction } from "../ir/irTypes";
import type { BasicBlock } from "./basicBlocks";

export interface UseDef {
  uses: Set<string>;
  defs: Set<string>;
}

export function instructionUseDef(instruction: IrInstruction): UseDef {
  const uses = new Set<string>();
  const defs = new Set<string>();
  for (const value of [instruction.arg1, instruction.arg2]) {
    if (value && isName(value)) uses.add(value);
  }
  if (instruction.result && isName(instruction.result)) defs.add(instruction.result);
  return { uses, defs };
}

export function blockUseDef(block: BasicBlock): UseDef {
  const uses = new Set<string>();
  const defs = new Set<string>();
  for (const instruction of block.instructions) {
    const item = instructionUseDef(instruction);
    for (const use of item.uses) if (!defs.has(use)) uses.add(use);
    for (const def of item.defs) defs.add(def);
  }
  return { uses, defs };
}

export function isName(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) || /^t\d+$/.test(value);
}

export function isConstant(value: string | undefined) {
  if (!value) return false;
  return /^-?\d+(\.\d+)?$/.test(value) || value === "true" || value === "false" || /^".*"$/.test(value);
}

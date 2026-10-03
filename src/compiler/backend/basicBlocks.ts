import type { IrInstruction } from "../ir/irTypes";

export interface BasicBlock {
  id: string;
  instructions: IrInstruction[];
  startInstructionIndex: number;
  endInstructionIndex: number;
  sourceRange?: IrInstruction["sourceRange"];
  successors: string[];
  predecessors: string[];
}

export function identifyLeaders(instructions: IrInstruction[]): Set<number> {
  const leaders = new Set<number>();
  if (instructions.length === 0) return leaders;
  leaders.add(0);
  const labelToIndex = labelIndex(instructions);

  instructions.forEach((instruction, index) => {
    if (instruction.kind === "FUNCTION_START") leaders.add(index);
    if ((instruction.kind === "GOTO" || instruction.kind === "IF_FALSE_GOTO") && instruction.label) {
      const target = labelToIndex.get(instruction.label);
      if (target !== undefined) leaders.add(target);
      if (index + 1 < instructions.length) leaders.add(index + 1);
    }
    if (instruction.kind === "RETURN" && index + 1 < instructions.length) leaders.add(index + 1);
  });

  return leaders;
}

export function buildBasicBlocks(instructions: IrInstruction[]): BasicBlock[] {
  const leaders = [...identifyLeaders(instructions)].sort((a, b) => a - b);
  return leaders.map((start, index) => {
    const end = (leaders[index + 1] ?? instructions.length) - 1;
    const blockInstructions = instructions.slice(start, end + 1);
    return {
      id: `B${index + 1}`,
      instructions: blockInstructions,
      startInstructionIndex: start,
      endInstructionIndex: end,
      sourceRange: blockInstructions.find((instruction) => instruction.sourceRange)?.sourceRange,
      successors: [],
      predecessors: []
    };
  });
}

export function labelIndex(instructions: IrInstruction[]) {
  const map = new Map<string, number>();
  instructions.forEach((instruction, index) => {
    if (instruction.kind === "LABEL" && instruction.label) map.set(instruction.label, index);
    if (instruction.kind === "FUNCTION_START" && instruction.functionName) map.set(instruction.functionName, index);
  });
  return map;
}

export function instructionText(instruction: IrInstruction) {
  return instruction.text;
}

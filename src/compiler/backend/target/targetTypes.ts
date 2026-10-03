import type { AstSourceRange } from "../../syntax/ast/astTypes";

export type TargetOpcode =
  | "MOV"
  | "LOAD"
  | "STORE"
  | "ADD"
  | "SUB"
  | "MUL"
  | "DIV"
  | "MOD"
  | "CMP"
  | "SETLT"
  | "SETLE"
  | "SETGT"
  | "SETGE"
  | "SETEQ"
  | "SETNE"
  | "AND"
  | "OR"
  | "NOT"
  | "JMP"
  | "JE"
  | "CALL"
  | "RET"
  | "PUSH"
  | "POP"
  | "PRINT"
  | "LABEL";

export type TargetOperand =
  | { kind: "REGISTER"; value: string }
  | { kind: "IMMEDIATE"; value: string }
  | { kind: "MEMORY"; value: string }
  | { kind: "LABEL"; value: string }
  | { kind: "STRING"; value: string };

export interface TargetInstruction {
  id: string;
  opcode: TargetOpcode;
  operands: TargetOperand[];
  sourceIrIds: string[];
  sourceRange?: AstSourceRange;
  text: string;
}

export interface RegisterState {
  registers: Record<string, string | null>;
  spills: Record<string, string>;
}

export interface CodegenEvent {
  id: string;
  type: "CODEGEN_STARTED" | "REGISTER_ALLOCATED" | "REGISTER_FREED" | "VALUE_SPILLED" | "TARGET_INSTRUCTION_EMITTED" | "CODEGEN_COMPLETED";
  message: string;
  instructionId?: string;
  sourceIrIds?: string[];
  registerState: RegisterState;
  targetSoFar: TargetInstruction[];
}

export interface TargetProgram {
  targetInstructions: TargetInstruction[];
  events: CodegenEvent[];
  memorySlots: Record<string, string>;
}

export interface MachineOptimizationEvent {
  id: string;
  type:
    | "MACHINE_OPT_STARTED"
    | "PEEPHOLE_WINDOW_INSPECTED"
    | "TARGET_INSTRUCTION_REMOVED"
    | "TARGET_INSTRUCTION_REPLACED"
    | "REDUNDANT_MOVE_REMOVED"
    | "REDUNDANT_LOAD_REMOVED"
    | "JUMP_SIMPLIFIED"
    | "MACHINE_OPT_COMPLETED";
  before?: string;
  after?: string;
  reason: string;
  targetAfter: TargetInstruction[];
}

export interface MachineOptimizationResult {
  originalTarget: TargetInstruction[];
  finalTarget: TargetInstruction[];
  events: MachineOptimizationEvent[];
}

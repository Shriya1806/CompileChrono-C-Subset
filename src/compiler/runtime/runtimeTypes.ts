import type { TargetInstruction } from "../backend/target/targetTypes";
import type { SemanticAnalysisResult } from "../semantic/semanticTypes";

export type RuntimeValue = number | string | boolean | null;

export interface RuntimeFrame {
  functionName: string;
  returnPc: number;
}

export interface RuntimeState {
  pc: number;
  registers: Record<string, RuntimeValue>;
  memory: Record<string, RuntimeValue>;
  operandStack: RuntimeValue[];
  callStack: RuntimeFrame[];
  output: string[];
  currentInstructionId?: string;
  halted: boolean;
  error?: string;
}

export interface RuntimeEvent {
  id: string;
  type: "RUNTIME_STARTED" | "RUNTIME_INSTRUCTION_EXECUTED" | "RUNTIME_OUTPUT_EMITTED" | "RUNTIME_HALTED" | "RUNTIME_ERROR";
  instructionId?: string;
  pc: number;
  message: string;
  state: RuntimeState;
}

export interface RuntimeSession {
  instructions: TargetInstruction[];
  states: RuntimeState[];
  events: RuntimeEvent[];
  finalState: RuntimeState;
  semantic?: SemanticAnalysisResult | null;
}

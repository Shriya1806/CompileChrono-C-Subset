import type { IrInstruction } from "../../ir/irTypes";

export interface OptimizationEvent {
  id: string;
  type:
    | "OPTIMIZATION_STARTED"
    | "PASS_STARTED"
    | "INSTRUCTION_ANALYZED"
    | "CONSTANT_FOLDED"
    | "CONSTANT_PROPAGATED"
    | "COPY_PROPAGATED"
    | "ALGEBRAIC_SIMPLIFIED"
    | "COMMON_SUBEXPRESSION_REUSED"
    | "DEAD_CODE_REMOVED"
    | "UNREACHABLE_CODE_REMOVED"
    | "INSTRUCTION_REPLACED"
    | "INSTRUCTION_REMOVED"
    | "PASS_COMPLETED"
    | "OPTIMIZATION_COMPLETED";
  passId?: string;
  instructionIds?: string[];
  before?: string;
  after?: string;
  reason: string;
  instructionsAfter: IrInstruction[];
}

export interface OptimizationPass {
  id: string;
  name: string;
  description: string;
  apply(ir: IrInstruction[], emit: (event: Omit<OptimizationEvent, "id" | "instructionsAfter">, instructions: IrInstruction[]) => void): OptimizationPassResult;
}

export interface OptimizationPassResult {
  changed: boolean;
  optimizedIR: IrInstruction[];
  statistics: Record<string, number>;
}

export interface OptimizationPipelineResult {
  originalIR: IrInstruction[];
  optimizedIR: IrInstruction[];
  events: OptimizationEvent[];
  statistics: Record<string, number>;
}

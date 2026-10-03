import type { AstSourceRange, ProgramNode } from "../syntax/ast/astTypes";

export type IrInstructionKind =
  | "ASSIGN"
  | "BINARY"
  | "UNARY"
  | "LABEL"
  | "GOTO"
  | "IF_FALSE_GOTO"
  | "PARAM"
  | "CALL"
  | "RETURN"
  | "FUNCTION_START"
  | "FUNCTION_END"
  | "PRINT";

export interface IrInstruction {
  id: string;
  kind: IrInstructionKind;
  op?: string;
  arg1?: string;
  arg2?: string;
  result?: string;
  label?: string;
  functionName?: string;
  argumentCount?: number;
  text: string;
  sourceRange?: AstSourceRange;
  astNodeId?: string;
}

export interface Quadruple {
  index: number;
  operator: string;
  arg1: string;
  arg2: string;
  result: string;
  instructionId: string;
}

export interface Triple {
  index: number;
  operator: string;
  arg1: string;
  arg2: string;
  instructionId: string;
}

export interface IrEvent {
  id: string;
  type:
    | "IR_GENERATION_STARTED"
    | "TEMP_CREATED"
    | "LABEL_CREATED"
    | "IR_INSTRUCTION_EMITTED"
    | "FUNCTION_IR_STARTED"
    | "FUNCTION_IR_COMPLETED"
    | "IR_VALIDATION_PASSED"
    | "IR_VALIDATION_FAILED"
    | "IR_GENERATION_COMPLETED";
  message: string;
  instructionId?: string;
  sourceRange?: AstSourceRange;
  payload?: Record<string, unknown>;
  instructionsSoFar: IrInstruction[];
}

export interface IrValidationDiagnostic {
  severity: "error" | "warning";
  message: string;
  instructionId?: string;
}

export interface IrGenerationResult {
  ast: ProgramNode;
  instructions: IrInstruction[];
  quadruples: Quadruple[];
  triples: Triple[];
  events: IrEvent[];
  diagnostics: IrValidationDiagnostic[];
}

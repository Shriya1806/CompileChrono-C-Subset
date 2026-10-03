import type { AstNode, FunctionCallNode, ProgramNode } from "../syntax/ast/astTypes";
import { LabelGenerator, TemporaryGenerator } from "./generators";
import type { IrEvent, IrGenerationResult, IrInstruction, IrValidationDiagnostic, Quadruple, Triple } from "./irTypes";

export function generateIr(ast: ProgramNode): IrGenerationResult {
  const temp = new TemporaryGenerator();
  const labels = new LabelGenerator();
  const instructions: IrInstruction[] = [];
  const events: IrEvent[] = [];
  let instructionIndex = 0;
  let eventIndex = 0;

  emit("IR_GENERATION_STARTED", "IR generation started.");
  for (const statement of ast.body) generateStatement(statement);
  const diagnostics = validateIr(instructions);
  emit(diagnostics.some((diagnostic) => diagnostic.severity === "error") ? "IR_VALIDATION_FAILED" : "IR_VALIDATION_PASSED", "IR validation completed.", { diagnostics });
  emit("IR_GENERATION_COMPLETED", "IR generation completed.");

  return {
    ast,
    instructions,
    quadruples: toQuadruples(instructions),
    triples: toTriples(instructions),
    events,
    diagnostics
  };

  function generateStatement(node: AstNode) {
    switch (node.kind) {
      case "VariableDeclaration":
        if (node.initializer) emitAssign(node.name, generateExpression(node.initializer), node);
        return;
      case "Assignment":
        emitAssign(node.target.name, generateExpression(node.value), node);
        return;
      case "ShowStatement": {
        const value = generateExpression(node.expression);
        emitInstruction({ kind: "PARAM", arg1: value, text: `param ${value}`, sourceRange: node.sourceRange, astNodeId: node.id });
        emitInstruction({ kind: "CALL", functionName: "show", argumentCount: 1, text: "call show, 1", sourceRange: node.sourceRange, astNodeId: node.id });
        return;
      }
      case "Block":
        node.body.forEach(generateStatement);
        return;
      case "IfStatement": {
        const condition = generateExpression(node.condition);
        const elseLabel = newLabel();
        const endLabel = node.elseBranch ? newLabel() : elseLabel;
        emitInstruction({ kind: "IF_FALSE_GOTO", arg1: condition, label: elseLabel, text: `ifFalse ${condition} goto ${elseLabel}`, sourceRange: node.condition.sourceRange, astNodeId: node.id });
        generateStatement(node.thenBranch);
        if (node.elseBranch) {
          emitInstruction({ kind: "GOTO", label: endLabel, text: `goto ${endLabel}`, sourceRange: node.sourceRange, astNodeId: node.id });
          emitLabel(elseLabel, node.elseBranch);
          generateStatement(node.elseBranch);
          emitLabel(endLabel, node);
        } else {
          emitLabel(elseLabel, node);
        }
        return;
      }
      case "WhileStatement": {
        const start = newLabel();
        const end = newLabel();
        emitLabel(start, node);
        const condition = generateExpression(node.condition);
        emitInstruction({ kind: "IF_FALSE_GOTO", arg1: condition, label: end, text: `ifFalse ${condition} goto ${end}`, sourceRange: node.condition.sourceRange, astNodeId: node.id });
        generateStatement(node.body);
        emitInstruction({ kind: "GOTO", label: start, text: `goto ${start}`, sourceRange: node.sourceRange, astNodeId: node.id });
        emitLabel(end, node);
        return;
      }
      case "FunctionDeclaration":
        emit("FUNCTION_IR_STARTED", `Function IR started for ${node.name}.`, { functionName: node.name });
        emitInstruction({ kind: "FUNCTION_START", functionName: node.name, text: `func ${node.name}:`, sourceRange: node.sourceRange, astNodeId: node.id });
        generateStatement(node.body);
        emitInstruction({ kind: "FUNCTION_END", functionName: node.name, text: "endfunc", sourceRange: node.sourceRange, astNodeId: node.id });
        emit("FUNCTION_IR_COMPLETED", `Function IR completed for ${node.name}.`, { functionName: node.name });
        return;
      case "ReturnStatement": {
        const value = node.value ? generateExpression(node.value) : undefined;
        emitInstruction({ kind: "RETURN", arg1: value, text: value ? `return ${value}` : "return", sourceRange: node.sourceRange, astNodeId: node.id });
        return;
      }
      case "FunctionCall":
        generateExpression(node);
        return;
      default:
        generateExpression(node);
    }
  }

  function generateExpression(node: AstNode): string {
    switch (node.kind) {
      case "Literal":
        return node.value;
      case "Identifier":
        return node.name;
      case "BinaryExpression": {
        const left = generateExpression(node.left);
        const right = generateExpression(node.right);
        const result = newTemp();
        emitInstruction({ kind: "BINARY", op: node.operator, arg1: left, arg2: right, result, text: `${result} = ${left} ${node.operator} ${right}`, sourceRange: node.sourceRange, astNodeId: node.id });
        return result;
      }
      case "UnaryExpression": {
        const arg = generateExpression(node.argument);
        const result = newTemp();
        emitInstruction({ kind: "UNARY", op: node.operator, arg1: arg, result, text: `${result} = ${node.operator}${arg}`, sourceRange: node.sourceRange, astNodeId: node.id });
        return result;
      }
      case "FunctionCall":
        return generateCall(node);
      default:
        throw new Error(`Cannot generate expression IR for ${node.kind}`);
    }
  }

  function generateCall(node: FunctionCallNode): string {
    for (const arg of node.args) {
      const value = generateExpression(arg);
      emitInstruction({ kind: "PARAM", arg1: value, text: `param ${value}`, sourceRange: arg.sourceRange, astNodeId: arg.id });
    }
    const result = node.callee.name === "show" ? undefined : newTemp();
    emitInstruction({
      kind: "CALL",
      functionName: node.callee.name,
      argumentCount: node.args.length,
      result,
      text: result ? `${result} = call ${node.callee.name}, ${node.args.length}` : `call ${node.callee.name}, ${node.args.length}`,
      sourceRange: node.sourceRange,
      astNodeId: node.id
    });
    return result ?? "";
  }

  function emitAssign(target: string, value: string, node: AstNode) {
    emitInstruction({ kind: "ASSIGN", arg1: value, result: target, text: `${target} = ${value}`, sourceRange: node.sourceRange, astNodeId: node.id });
  }

  function emitLabel(label: string, node: AstNode) {
    emitInstruction({ kind: "LABEL", label, text: `${label}:`, sourceRange: node.sourceRange, astNodeId: node.id });
  }

  function newTemp() {
    const value = temp.next();
    emit("TEMP_CREATED", `Temporary ${value} created.`, { temporary: value });
    return value;
  }

  function newLabel() {
    const value = labels.next();
    emit("LABEL_CREATED", `Label ${value} created.`, { label: value });
    return value;
  }

  function emitInstruction(partial: Omit<IrInstruction, "id">) {
    const instruction: IrInstruction = { ...partial, id: `IR_${String(instructionIndex++).padStart(3, "0")}` };
    instructions.push(instruction);
    emit("IR_INSTRUCTION_EMITTED", instruction.text, { instructionId: instruction.id, instruction });
  }

  function emit(type: IrEvent["type"], message: string, payload: Record<string, unknown> = {}) {
    events.push({
      id: `ir-event-${eventIndex++}`,
      type,
      message,
      instructionId: typeof payload.instructionId === "string" ? payload.instructionId : undefined,
      sourceRange: (payload.instruction as IrInstruction | undefined)?.sourceRange,
      payload,
      instructionsSoFar: instructions.map((instruction) => ({ ...instruction }))
    });
  }
}

export function validateIr(instructions: IrInstruction[]): IrValidationDiagnostic[] {
  const diagnostics: IrValidationDiagnostic[] = [];
  const labels = new Set(instructions.filter((instruction) => instruction.kind === "LABEL" && instruction.label).map((instruction) => instruction.label!));
  const temps = new Set<string>();
  for (const instruction of instructions) {
    if (instruction.result?.startsWith("t")) {
      if (temps.has(instruction.result)) diagnostics.push({ severity: "error", message: `Temporary ${instruction.result} defined more than once.`, instructionId: instruction.id });
      temps.add(instruction.result);
    }
    if ((instruction.kind === "GOTO" || instruction.kind === "IF_FALSE_GOTO") && instruction.label && !labels.has(instruction.label)) {
      diagnostics.push({ severity: "error", message: `Jump target ${instruction.label} is not defined.`, instructionId: instruction.id });
    }
  }
  return diagnostics;
}

export function toQuadruples(instructions: IrInstruction[]): Quadruple[] {
  return instructions.map((instruction, index) => ({
    index,
    operator: instruction.op ?? quadOperator(instruction),
    arg1: instruction.arg1 ?? instruction.functionName ?? instruction.label ?? "-",
    arg2: instruction.arg2 ?? (instruction.argumentCount !== undefined ? String(instruction.argumentCount) : "-"),
    result: instruction.result ?? "-",
    instructionId: instruction.id
  }));
}

export function toTriples(instructions: IrInstruction[]): Triple[] {
  const tempProducer = new Map<string, number>();
  return instructions.map((instruction, index) => {
    if (instruction.result?.startsWith("t")) tempProducer.set(instruction.result, index);
    return {
      index,
      operator: instruction.op ?? quadOperator(instruction),
      arg1: ref(instruction.arg1),
      arg2: ref(instruction.arg2 ?? (instruction.argumentCount !== undefined ? String(instruction.argumentCount) : undefined)),
      instructionId: instruction.id
    };
  });

  function ref(value?: string) {
    if (!value) return "-";
    return tempProducer.has(value) ? `(${tempProducer.get(value)})` : value;
  }
}

function quadOperator(instruction: IrInstruction) {
  switch (instruction.kind) {
    case "ASSIGN":
      return "=";
    case "PARAM":
      return "PARAM";
    case "CALL":
      return "CALL";
    case "RETURN":
      return "RETURN";
    case "LABEL":
      return "LABEL";
    case "GOTO":
      return "GOTO";
    case "IF_FALSE_GOTO":
      return "IF_FALSE";
    case "FUNCTION_START":
      return "FUNC";
    case "FUNCTION_END":
      return "ENDFUNC";
    case "UNARY":
      return instruction.op ?? "UNARY";
    case "BINARY":
      return instruction.op ?? "BINARY";
    case "PRINT":
      return "PRINT";
  }
}

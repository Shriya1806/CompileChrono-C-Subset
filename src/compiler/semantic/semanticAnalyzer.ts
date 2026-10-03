import type { CompilerError } from "../lexer/lexicalError";
import { CompilerEventType, CompilerPhase } from "../snapshots/compilerEvent";
import { SnapshotRecorder } from "../snapshots/snapshotRecorder";
import type {
  AssignmentNode,
  AstNode,
  AstSourceRange,
  BinaryExpressionNode,
  BlockNode,
  FunctionCallNode,
  FunctionDeclarationNode,
  IdentifierNode,
  IfStatementNode,
  LiteralNode,
  ProgramNode,
  ReturnStatementNode,
  UnaryExpressionNode,
  VariableDeclarationNode,
  WhileStatementNode
} from "../syntax/ast/astTypes";
import { SymbolTable } from "./symbolTable";
import type { FunctionSymbol, Scope, SemanticSymbol } from "./symbols";
import type { SemanticAnalysisResult, SemanticAnnotation, SemanticEvent } from "./semanticTypes";
import { SemanticType, binaryResultType, isAssignable, typeFromKeyword, unaryResultType } from "./types";

interface FunctionContext {
  symbol: FunctionSymbol;
  returnSeen: boolean;
}

export function analyzeSemantics(ast: ProgramNode): SemanticAnalysisResult {
  const table = new SymbolTable();
  const recorder = new SnapshotRecorder();
  const annotations: Record<string, SemanticAnnotation> = {};
  const events: SemanticEvent[] = [];
  const errors: CompilerError[] = [];
  let eventIndex = 0;

  emit("SEMANTIC_ANALYSIS_STARTED", "Semantic analysis started.", { scopeId: table.currentScopeId });
  predeclareFunctions(ast);
  analyzeStatements(ast.body, null);
  emit("SEMANTIC_ANALYSIS_COMPLETED", errors.length === 0 ? "Semantic analysis completed successfully." : "Semantic analysis completed with errors.");

  for (const event of events) {
    recorder.record({
      type: event.type === "SEMANTIC_ERROR" ? CompilerEventType.SEMANTIC_ERROR : compilerEventType(event.type),
      phase: CompilerPhase.SEMANTIC,
      title: event.type,
      description: event.message,
      sourceRange: event.sourceRange,
      metadata: event.payload,
      output: { symbolTableState: event.symbolTableState }
    });
  }

  return {
    ast,
    annotations,
    symbols: [...table.symbols.values()],
    scopes: [...table.scopes.values()],
    events,
    errors,
    snapshots: recorder.snapshots
  };

  function predeclareFunctions(program: ProgramNode) {
    for (const statement of program.body) {
      if (statement.kind !== "FunctionDeclaration") continue;
      declareFunction(statement);
    }
  }

  function analyzeStatements(statements: AstNode[], functionContext: FunctionContext | null) {
    for (const statement of statements) analyzeStatement(statement, functionContext);
  }

  function analyzeStatement(node: AstNode, functionContext: FunctionContext | null): SemanticType {
    annotate(node, { scopeId: table.currentScopeId, semanticStatus: "pending" });
    switch (node.kind) {
      case "VariableDeclaration":
        return analyzeVariableDeclaration(node);
      case "Assignment":
        return analyzeAssignment(node);
      case "Block":
        return withScope("BLOCK", "BLOCK", node.sourceRange, () => {
          analyzeStatements(node.body, functionContext);
          return SemanticType.VOID;
        });
      case "IfStatement":
        return analyzeIf(node, functionContext);
      case "WhileStatement":
        return analyzeWhile(node, functionContext);
      case "ShowStatement": {
        const expressionType = analyzeExpression(node.expression);
        emit("TYPE_CHECK_PASSED", `show accepts ${expressionType}.`, { nodeId: node.id, sourceRange: node.sourceRange });
        annotate(node, { resolvedType: SemanticType.VOID, semanticStatus: "ok" });
        return SemanticType.VOID;
      }
      case "FunctionDeclaration":
        return analyzeFunction(node);
      case "FunctionCall":
        analyzeExpression(node);
        return SemanticType.VOID;
      case "ReturnStatement":
        return analyzeReturn(node, functionContext);
      default:
        return analyzeExpression(node);
    }
  }

  function analyzeVariableDeclaration(node: VariableDeclarationNode): SemanticType {
    const declaredType = typeFromKeyword(node.valueType);
    const result = table.declareSymbol({
      name: node.name,
      kind: "VARIABLE",
      type: declaredType,
      scopeId: table.currentScopeId,
      declarationRange: node.sourceRange,
      initialized: Boolean(node.initializer)
    });
    if (result.duplicate) {
      semanticError("DUPLICATE_SYMBOL", `Duplicate declaration of '${node.name}'.`, node.sourceRange, declaredType, undefined, node.name, result.duplicate.declarationRange);
    } else if (result.symbol) {
      emit("SYMBOL_DECLARED", `Declared variable ${node.name}: ${declaredType}.`, { symbolId: result.symbol.id, nodeId: node.id, sourceRange: node.sourceRange });
      annotate(node, { resolvedSymbolId: result.symbol.id, resolvedType: declaredType, semanticStatus: "ok" });
    }
    if (node.initializer) {
      const sourceType = analyzeExpression(node.initializer);
      if (!isAssignable(declaredType, sourceType)) {
        semanticError("TYPE_MISMATCH", `Cannot initialize ${node.name}: expected ${declaredType}, found ${sourceType}.`, node.initializer.sourceRange, declaredType, sourceType, node.name);
      } else {
        emit("TYPE_CHECK_PASSED", `Initializer assignment ${declaredType} <- ${sourceType} is valid.`, { nodeId: node.id, sourceRange: node.initializer.sourceRange });
      }
    }
    return SemanticType.VOID;
  }

  function analyzeAssignment(node: AssignmentNode): SemanticType {
    const targetType = analyzeIdentifier(node.target, "VARIABLE");
    const valueType = analyzeExpression(node.value);
    if (!isAssignable(targetType, valueType)) {
      semanticError("TYPE_MISMATCH", `Assignment type mismatch. Expected ${targetType}, found ${valueType}.`, node.value.sourceRange, targetType, valueType, node.target.name);
    } else {
      emit("TYPE_CHECK_PASSED", `Assignment ${targetType} <- ${valueType} is valid.`, { nodeId: node.id, sourceRange: node.sourceRange });
    }
    annotate(node, { resolvedType: targetType, semanticStatus: errorsForRange(node.sourceRange) ? "error" : "ok" });
    return SemanticType.VOID;
  }

  function analyzeIf(node: IfStatementNode, functionContext: FunctionContext | null): SemanticType {
    const conditionType = analyzeExpression(node.condition);
    checkCondition(conditionType, node.condition.sourceRange);
    analyzeStatement(node.thenBranch, functionContext);
    if (node.elseBranch) analyzeStatement(node.elseBranch, functionContext);
    annotate(node, { resolvedType: SemanticType.VOID, semanticStatus: "ok" });
    return SemanticType.VOID;
  }

  function analyzeWhile(node: WhileStatementNode, functionContext: FunctionContext | null): SemanticType {
    const conditionType = analyzeExpression(node.condition);
    checkCondition(conditionType, node.condition.sourceRange);
    analyzeStatement(node.body, functionContext);
    annotate(node, { resolvedType: SemanticType.VOID, semanticStatus: "ok" });
    return SemanticType.VOID;
  }

  function checkCondition(type: SemanticType, range?: AstSourceRange) {
    if (type !== SemanticType.BOOL && type !== SemanticType.ERROR) {
      semanticError("INVALID_CONDITION_TYPE", `Condition must be BOOL. Found ${type}.`, range, SemanticType.BOOL, type);
    } else {
      emit("TYPE_CHECK_PASSED", `Condition type ${type} is valid.`, { sourceRange: range });
    }
  }

  function declareFunction(node: FunctionDeclarationNode): FunctionSymbol | undefined {
    const returnType = typeFromKeyword(node.returnType);
    const result = table.declareSymbol({
      name: node.name,
      kind: "FUNCTION",
      type: returnType,
      scopeId: "SCOPE_GLOBAL",
      declarationRange: node.sourceRange,
      parameters: node.params.map((param) => ({ name: param.name, type: typeFromKeyword(param.valueType) }))
    });
    if (result.duplicate) {
      semanticError("DUPLICATE_FUNCTION", `Duplicate function '${node.name}'.`, node.sourceRange, returnType, undefined, node.name, result.duplicate.declarationRange);
      return undefined;
    }
    if (result.symbol?.kind === "FUNCTION") {
      emit("SYMBOL_DECLARED", `Declared function ${node.name}.`, { symbolId: result.symbol.id, nodeId: node.id, sourceRange: node.sourceRange });
      annotate(node, { resolvedSymbolId: result.symbol.id, resolvedType: returnType, semanticStatus: "ok", functionSignature: signature(result.symbol) });
      return result.symbol;
    }
    return undefined;
  }

  function analyzeFunction(node: FunctionDeclarationNode): SemanticType {
    const symbol = table.lookupFunction(node.name) ?? declareFunction(node);
    if (!symbol) return SemanticType.ERROR;
    withScope("FUNCTION", `FUNCTION:${node.name}`, node.sourceRange, () => {
      emit("SCOPE_ENTERED", `Entered function scope ${node.name}.`, { scopeId: table.currentScopeId, nodeId: node.id, sourceRange: node.sourceRange });
      node.params.forEach((param, index) => {
        const paramSymbol = table.declareSymbol({
          name: param.name,
          kind: "PARAMETER",
          type: typeFromKeyword(param.valueType),
          scopeId: table.currentScopeId,
          declarationRange: param.sourceRange,
          initialized: true,
          position: index
        });
        if (paramSymbol.duplicate) {
          semanticError("DUPLICATE_SYMBOL", `Duplicate parameter '${param.name}'.`, param.sourceRange, typeFromKeyword(param.valueType), undefined, param.name, paramSymbol.duplicate.declarationRange);
        } else if (paramSymbol.symbol) {
          symbol.parameters[index].symbolId = paramSymbol.symbol.id;
          emit("SYMBOL_DECLARED", `Declared parameter ${param.name}.`, { symbolId: paramSymbol.symbol.id, nodeId: param.id, sourceRange: param.sourceRange });
          annotate(param, { resolvedSymbolId: paramSymbol.symbol.id, resolvedType: paramSymbol.symbol.type, semanticStatus: "ok" });
        }
      });
      const context: FunctionContext = { symbol, returnSeen: false };
      analyzeStatement(node.body, context);
      if (symbol.type !== SemanticType.VOID && !context.returnSeen) {
        semanticError("INVALID_RETURN_TYPE", `Function '${node.name}' must return ${symbol.type}.`, node.sourceRange, symbol.type, SemanticType.VOID, node.name);
      }
      return SemanticType.VOID;
    });
    return SemanticType.VOID;
  }

  function analyzeReturn(node: ReturnStatementNode, functionContext: FunctionContext | null): SemanticType {
    if (!functionContext) {
      semanticError("RETURN_OUTSIDE_FUNCTION", "Return statement outside a function.", node.sourceRange, undefined, undefined);
      return SemanticType.ERROR;
    }
    functionContext.returnSeen = true;
    const actual = node.value ? analyzeExpression(node.value) : SemanticType.VOID;
    if (!isAssignable(functionContext.symbol.type, actual)) {
      semanticError("INVALID_RETURN_TYPE", `Function return type ${functionContext.symbol.type} but return statement produces ${actual}.`, node.sourceRange, functionContext.symbol.type, actual, functionContext.symbol.name);
    } else {
      emit("RETURN_CHECKED", `Return ${actual} matches ${functionContext.symbol.type}.`, { nodeId: node.id, sourceRange: node.sourceRange });
    }
    annotate(node, { resolvedType: actual, semanticStatus: "ok" });
    return actual;
  }

  function analyzeExpression(node: AstNode): SemanticType {
    switch (node.kind) {
      case "Literal":
        return analyzeLiteral(node);
      case "Identifier":
        return analyzeIdentifier(node);
      case "BinaryExpression":
        return analyzeBinary(node);
      case "UnaryExpression":
        return analyzeUnary(node);
      case "FunctionCall":
        return analyzeCall(node);
      default:
        return analyzeStatement(node, null);
    }
  }

  function analyzeLiteral(node: LiteralNode): SemanticType {
    const type =
      node.literalType === "integer"
        ? SemanticType.NUM
        : node.literalType === "decimal"
          ? SemanticType.DEC
          : node.literalType === "string"
            ? SemanticType.TEXT
            : SemanticType.BOOL;
    annotate(node, { resolvedType: type, constantValue: node.value, semanticStatus: "ok" });
    emit("TYPE_INFERRED", `Literal ${node.value} has type ${type}.`, { nodeId: node.id, sourceRange: node.sourceRange, payload: { type } });
    return type;
  }

  function analyzeIdentifier(node: IdentifierNode, expectedKind?: "VARIABLE" | "FUNCTION" | "PARAMETER"): SemanticType {
    const symbol = table.lookup(node.name);
    if (!symbol) {
      semanticError("UNDECLARED_IDENTIFIER", `Undeclared identifier '${node.name}'.`, node.sourceRange, undefined, undefined, node.name);
      annotate(node, { resolvedType: SemanticType.ERROR, semanticStatus: "error" });
      return SemanticType.ERROR;
    }
    if (expectedKind && symbol.kind === "FUNCTION") {
      semanticError("TYPE_MISMATCH", `'${node.name}' is a function, not a variable.`, node.sourceRange, undefined, undefined, node.name);
    }
    symbol.references.push(...(node.sourceRange ? [node.sourceRange] : []));
    annotate(node, { resolvedSymbolId: symbol.id, resolvedType: symbol.type, scopeId: symbol.scopeId, semanticStatus: "ok" });
    emit("SYMBOL_RESOLVED", `Resolved ${node.name} to ${symbol.id}.`, { symbolId: symbol.id, nodeId: node.id, sourceRange: node.sourceRange, payload: { type: symbol.type } });
    return symbol.type;
  }

  function analyzeBinary(node: BinaryExpressionNode): SemanticType {
    const left = analyzeExpression(node.left);
    const right = analyzeExpression(node.right);
    const type = binaryResultType(node.operator, left, right);
    if (type === SemanticType.ERROR) {
      semanticError("INVALID_OPERATOR_TYPES", `Operator ${node.operator} cannot be applied to ${left} and ${right}.`, node.sourceRange, "compatible operands", `${left}, ${right}`);
    } else {
      emit("TYPE_CHECK_PASSED", `${left} ${node.operator} ${right} -> ${type}.`, { nodeId: node.id, sourceRange: node.sourceRange });
    }
    annotate(node, { resolvedType: type, semanticStatus: type === SemanticType.ERROR ? "error" : "ok" });
    return type;
  }

  function analyzeUnary(node: UnaryExpressionNode): SemanticType {
    const argument = analyzeExpression(node.argument);
    const type = unaryResultType(node.operator, argument);
    if (type === SemanticType.ERROR) {
      semanticError("INVALID_OPERATOR_TYPES", `Operator ${node.operator} cannot be applied to ${argument}.`, node.sourceRange, "compatible operand", argument);
    } else {
      emit("TYPE_CHECK_PASSED", `${node.operator}${argument} -> ${type}.`, { nodeId: node.id, sourceRange: node.sourceRange });
    }
    annotate(node, { resolvedType: type, semanticStatus: type === SemanticType.ERROR ? "error" : "ok" });
    return type;
  }

  function analyzeCall(node: FunctionCallNode): SemanticType {
    const symbol = table.lookupFunction(node.callee.name);
    if (!symbol) {
      semanticError("UNKNOWN_FUNCTION", `Unknown function '${node.callee.name}'.`, node.callee.sourceRange, undefined, undefined, node.callee.name);
      annotate(node, { resolvedType: SemanticType.ERROR, semanticStatus: "error" });
      return SemanticType.ERROR;
    }
    annotate(node.callee, { resolvedSymbolId: symbol.id, resolvedType: symbol.type, semanticStatus: "ok" });
    emit("FUNCTION_RESOLVED", `Resolved function ${node.callee.name}.`, { symbolId: symbol.id, nodeId: node.id, sourceRange: node.callee.sourceRange });
    if (node.args.length !== symbol.parameters.length) {
      semanticError("ARGUMENT_COUNT_MISMATCH", `Function ${symbol.name} expected ${symbol.parameters.length} arguments. Found ${node.args.length}.`, node.sourceRange, String(symbol.parameters.length), String(node.args.length), symbol.name);
    }
    node.args.forEach((arg, index) => {
      const actual = analyzeExpression(arg);
      const expected = symbol.parameters[index]?.type;
      if (expected && !isAssignable(expected, actual)) {
        semanticError("ARGUMENT_TYPE_MISMATCH", `Argument ${index + 1} expected ${expected}. Found ${actual}.`, arg.sourceRange, expected, actual, symbol.name);
      } else if (expected) {
        emit("ARGUMENT_CHECKED", `Argument ${index + 1} ${actual} matches ${expected}.`, { nodeId: arg.id, sourceRange: arg.sourceRange });
      }
    });
    annotate(node, { resolvedSymbolId: symbol.id, resolvedType: symbol.type, semanticStatus: "ok", functionSignature: signature(symbol) });
    return symbol.type;
  }

  function withScope<T>(kind: Scope["kind"], name: string, sourceRange: AstSourceRange | undefined, callback: () => T): T {
    const scope = table.createScope(kind, name, sourceRange);
    emit("SCOPE_ENTERED", `Entered ${scope.name}.`, { scopeId: scope.id, sourceRange });
    const value = callback();
    emit("SCOPE_EXITED", `Exited ${scope.name}.`, { scopeId: scope.id, sourceRange });
    table.exitScope();
    return value;
  }

  function annotate(node: AstNode, patch: Partial<SemanticAnnotation>) {
    annotations[node.id] = { ...annotations[node.id], nodeId: node.id, semanticStatus: "pending", ...patch };
  }

  function semanticError(
    code: string,
    message: string,
    sourceRange: AstSourceRange | undefined,
    expected?: string | SemanticType,
    actual?: string | SemanticType,
    symbolName?: string,
    relatedLocation?: AstSourceRange
  ) {
    const range = sourceRange ?? { startOffset: 0, endOffset: 1, line: 1, column: 1, length: 1 };
    const error: CompilerError = {
      id: `semantic-error-${errors.length}`,
      phase: "SEMANTIC",
      code,
      message,
      line: range.line,
      column: range.column,
      length: range.length,
      severity: "error",
      expected: expected ? String(expected) : undefined,
      actual: actual ? String(actual) : undefined,
      found: actual ? String(actual) : undefined,
      symbolName,
      scopeId: table.currentScopeId,
      relatedLocation,
      sourceRange: range
    };
    errors.push(error);
    emit("SEMANTIC_ERROR", message, { sourceRange: range, payload: { error } });
    emit("TYPE_CHECK_FAILED", message, { sourceRange: range, payload: { error } });
  }

  function errorsForRange(range?: AstSourceRange) {
    return Boolean(range && errors.some((error) => error.sourceRange.startOffset >= range.startOffset && error.sourceRange.endOffset <= range.endOffset));
  }

  function emit(
    type: SemanticEvent["type"],
    message: string,
    extra: Partial<Omit<SemanticEvent, "id" | "type" | "message" | "symbolTableState">> = {}
  ) {
    events.push({
      id: `semantic-event-${eventIndex++}`,
      type,
      message,
      symbolTableState: [...table.symbols.values()].map((symbol) => ({ ...symbol, references: [...symbol.references] })),
      ...extra
    });
  }
}

function signature(symbol: FunctionSymbol) {
  return `${symbol.name}(${symbol.parameters.map((param) => param.type).join(", ")}) -> ${symbol.type}`;
}

function compilerEventType(type: SemanticEvent["type"]) {
  return CompilerEventType[type] ?? CompilerEventType.PARSER_STEP;
}

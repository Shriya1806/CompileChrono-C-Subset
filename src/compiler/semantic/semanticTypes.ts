import type { CompilerError } from "../lexer/lexicalError";
import type { CompilerSnapshot } from "../snapshots/compilerSnapshot";
import type { AstNode, AstSourceRange, ProgramNode } from "../syntax/ast/astTypes";
import type { Scope, SemanticSymbol } from "./symbols";
import type { SemanticType } from "./types";

export interface SemanticAnnotation {
  nodeId: string;
  resolvedType?: SemanticType;
  resolvedSymbolId?: string;
  scopeId?: string;
  constantValue?: string;
  semanticStatus: "ok" | "error" | "pending";
  functionSignature?: string;
}

export interface SemanticEvent {
  id: string;
  type:
    | "SEMANTIC_ANALYSIS_STARTED"
    | "SCOPE_ENTERED"
    | "SCOPE_EXITED"
    | "SYMBOL_DECLARED"
    | "SYMBOL_RESOLVED"
    | "TYPE_INFERRED"
    | "TYPE_CHECK_PASSED"
    | "TYPE_CHECK_FAILED"
    | "FUNCTION_RESOLVED"
    | "ARGUMENT_CHECKED"
    | "RETURN_CHECKED"
    | "SEMANTIC_ERROR"
    | "SEMANTIC_ANALYSIS_COMPLETED";
  message: string;
  scopeId?: string;
  symbolId?: string;
  nodeId?: string;
  sourceRange?: AstSourceRange;
  payload?: Record<string, unknown>;
  symbolTableState: SemanticSymbol[];
}

export interface SemanticAnalysisResult {
  ast: ProgramNode;
  annotations: Record<string, SemanticAnnotation>;
  symbols: SemanticSymbol[];
  scopes: Scope[];
  events: SemanticEvent[];
  errors: CompilerError[];
  snapshots: CompilerSnapshot[];
}

export function astKind(node: AstNode) {
  return node.kind;
}

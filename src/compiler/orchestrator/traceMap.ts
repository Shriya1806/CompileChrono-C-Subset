import type { CompileResult } from "../compile";
import type { Token } from "../lexer/token";
import type { AstNode } from "../syntax/ast/astTypes";

export interface TraceEntry {
  id: string;
  label: string;
  kind: "TOKEN" | "AST" | "SYMBOL" | "IR" | "TARGET" | "ERROR";
  sourceRange?: { startOffset: number; endOffset: number; line: number; column: number; length: number };
  tokenIds: string[];
  astNodeIds: string[];
  symbolIds: string[];
  irInstructionIds: string[];
  targetInstructionIds: string[];
}

export interface TraceMap {
  entries: TraceEntry[];
  bySourceOffset: Record<number, string[]>;
  byArtifactId: Record<string, string[]>;
}

export function buildTraceMap(result: CompileResult): TraceMap {
  const entries: TraceEntry[] = [];
  const byArtifactId: Record<string, string[]> = {};
  const bySourceOffset: Record<number, string[]> = {};

  const add = (entry: TraceEntry) => {
    entries.push(entry);
    for (const id of [...entry.tokenIds, ...entry.astNodeIds, ...entry.symbolIds, ...entry.irInstructionIds, ...entry.targetInstructionIds]) {
      byArtifactId[id] = [...(byArtifactId[id] ?? []), entry.id];
    }
    if (entry.sourceRange) {
      for (let offset = entry.sourceRange.startOffset; offset <= entry.sourceRange.endOffset; offset++) {
        bySourceOffset[offset] = [...(bySourceOffset[offset] ?? []), entry.id];
      }
    }
  };

  for (const token of result.tokens.filter((item) => item.type !== "EOF")) {
    add({
      id: `trace-token-${token.id}`,
      label: `${token.type} '${token.lexeme}'`,
      kind: "TOKEN",
      sourceRange: tokenRange(token),
      tokenIds: [token.id],
      astNodeIds: [],
      symbolIds: [],
      irInstructionIds: [],
      targetInstructionIds: []
    });
  }

  if (result.syntax?.ast) {
    walkAst(result.syntax.ast, (node) => {
      add({
        id: `trace-ast-${node.id}`,
        label: node.kind,
        kind: "AST",
        sourceRange: node.sourceRange,
        tokenIds: tokensInRange(result.tokens, node.sourceRange),
        astNodeIds: [node.id],
        symbolIds: result.semantic?.annotations[node.id]?.resolvedSymbolId ? [result.semantic.annotations[node.id].resolvedSymbolId].filter(Boolean) as string[] : [],
        irInstructionIds: result.ir?.instructions.filter((instruction) => instruction.astNodeId === node.id).map((instruction) => instruction.id) ?? [],
        targetInstructionIds: []
      });
    });
  }

  for (const symbol of result.semantic?.symbols ?? []) {
    add({
      id: `trace-symbol-${symbol.id}`,
      label: `${symbol.kind.toLowerCase()} ${symbol.name}`,
      kind: "SYMBOL",
      sourceRange: symbol.declarationRange,
      tokenIds: tokensInRange(result.tokens, symbol.declarationRange),
      astNodeIds: [],
      symbolIds: [symbol.id],
      irInstructionIds: result.ir?.instructions.filter((instruction) => instruction.text.includes(symbol.name)).map((instruction) => instruction.id) ?? [],
      targetInstructionIds: []
    });
  }

  for (const instruction of result.ir?.instructions ?? []) {
    const targetIds = result.backend?.machineOptimization.finalTarget.filter((target) => target.sourceIrIds.includes(instruction.id)).map((target) => target.id) ?? [];
    add({
      id: `trace-ir-${instruction.id}`,
      label: instruction.text,
      kind: "IR",
      sourceRange: instruction.sourceRange,
      tokenIds: tokensInRange(result.tokens, instruction.sourceRange),
      astNodeIds: instruction.astNodeId ? [instruction.astNodeId] : [],
      symbolIds: [],
      irInstructionIds: [instruction.id],
      targetInstructionIds: targetIds
    });
  }

  for (const target of result.backend?.machineOptimization.finalTarget ?? []) {
    add({
      id: `trace-target-${target.id}`,
      label: target.text,
      kind: "TARGET",
      sourceRange: target.sourceRange,
      tokenIds: tokensInRange(result.tokens, target.sourceRange),
      astNodeIds: [],
      symbolIds: [],
      irInstructionIds: target.sourceIrIds,
      targetInstructionIds: [target.id]
    });
  }

  for (const error of result.allErrors) {
    add({
      id: `trace-error-${error.id}`,
      label: error.message,
      kind: "ERROR",
      sourceRange: error.sourceRange,
      tokenIds: tokensInRange(result.tokens, error.sourceRange),
      astNodeIds: [],
      symbolIds: [],
      irInstructionIds: [],
      targetInstructionIds: []
    });
  }

  return { entries, bySourceOffset, byArtifactId };
}

function tokenRange(token: Token) {
  return {
    startOffset: token.startOffset,
    endOffset: token.endOffset,
    line: token.line,
    column: token.column,
    length: Math.max(1, token.endOffset - token.startOffset)
  };
}

function tokensInRange(tokens: Token[], range?: TraceEntry["sourceRange"]) {
  if (!range) return [];
  return tokens.filter((token) => token.type !== "EOF" && token.startOffset >= range.startOffset && token.endOffset <= range.endOffset).map((token) => token.id);
}

function walkAst(node: AstNode, visit: (node: AstNode) => void) {
  visit(node);
  for (const child of children(node)) walkAst(child, visit);
}

function children(node: AstNode): AstNode[] {
  switch (node.kind) {
    case "Program":
      return node.body;
    case "VariableDeclaration":
      return node.initializer ? [node.initializer] : [];
    case "Assignment":
      return [node.target, node.value];
    case "BinaryExpression":
      return [node.left, node.right];
    case "UnaryExpression":
      return [node.argument];
    case "IfStatement":
      return [node.condition, node.thenBranch, ...(node.elseBranch ? [node.elseBranch] : [])];
    case "WhileStatement":
      return [node.condition, node.body];
    case "Block":
      return node.body;
    case "ShowStatement":
      return [node.expression];
    case "FunctionDeclaration":
      return [...node.params, node.body];
    case "FunctionCall":
      return [node.callee, ...node.args];
    case "ReturnStatement":
      return node.value ? [node.value] : [];
    default:
      return [];
  }
}

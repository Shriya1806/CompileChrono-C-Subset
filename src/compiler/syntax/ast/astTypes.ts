import type { Token } from "../../lexer/token";

export interface AstSourceRange {
  startOffset: number;
  endOffset: number;
  line: number;
  column: number;
  length: number;
}

interface BaseAstNode {
  id: string;
  kind: string;
  sourceRange?: AstSourceRange;
}

export interface ProgramNode extends BaseAstNode {
  kind: "Program";
  body: AstNode[];
}

export interface VariableDeclarationNode extends BaseAstNode {
  kind: "VariableDeclaration";
  valueType: string;
  name: string;
  initializer?: AstNode;
}

export interface AssignmentNode extends BaseAstNode {
  kind: "Assignment";
  target: IdentifierNode;
  value: AstNode;
}

export interface BinaryExpressionNode extends BaseAstNode {
  kind: "BinaryExpression";
  operator: string;
  left: AstNode;
  right: AstNode;
}

export interface UnaryExpressionNode extends BaseAstNode {
  kind: "UnaryExpression";
  operator: string;
  argument: AstNode;
}

export interface LiteralNode extends BaseAstNode {
  kind: "Literal";
  value: string;
  literalType: "integer" | "decimal" | "string" | "boolean";
}

export interface IdentifierNode extends BaseAstNode {
  kind: "Identifier";
  name: string;
}

export interface IfStatementNode extends BaseAstNode {
  kind: "IfStatement";
  condition: AstNode;
  thenBranch: BlockNode;
  elseBranch?: BlockNode;
}

export interface WhileStatementNode extends BaseAstNode {
  kind: "WhileStatement";
  condition: AstNode;
  body: BlockNode;
}

export interface BlockNode extends BaseAstNode {
  kind: "Block";
  body: AstNode[];
}

export interface ShowStatementNode extends BaseAstNode {
  kind: "ShowStatement";
  expression: AstNode;
}

export interface FunctionDeclarationNode extends BaseAstNode {
  kind: "FunctionDeclaration";
  name: string;
  returnType: string;
  params: ParameterNode[];
  body: BlockNode;
}

export interface ParameterNode extends BaseAstNode {
  kind: "Parameter";
  valueType: string;
  name: string;
}

export interface FunctionCallNode extends BaseAstNode {
  kind: "FunctionCall";
  callee: IdentifierNode;
  args: AstNode[];
}

export interface ReturnStatementNode extends BaseAstNode {
  kind: "ReturnStatement";
  value?: AstNode;
}

export type AstNode =
  | ProgramNode
  | VariableDeclarationNode
  | AssignmentNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | LiteralNode
  | IdentifierNode
  | IfStatementNode
  | WhileStatementNode
  | BlockNode
  | ShowStatementNode
  | FunctionDeclarationNode
  | ParameterNode
  | FunctionCallNode
  | ReturnStatementNode;

export function tokenRange(token: Token): AstSourceRange {
  return {
    startOffset: token.startOffset,
    endOffset: token.endOffset,
    line: token.line,
    column: token.column,
    length: Math.max(1, token.endOffset - token.startOffset)
  };
}

export function mergeRanges(...ranges: Array<AstSourceRange | undefined>): AstSourceRange | undefined {
  const valid = ranges.filter(Boolean) as AstSourceRange[];
  if (valid.length === 0) return undefined;
  const start = Math.min(...valid.map((range) => range.startOffset));
  const end = Math.max(...valid.map((range) => range.endOffset));
  const first = valid.find((range) => range.startOffset === start)!;
  return { startOffset: start, endOffset: end, line: first.line, column: first.column, length: Math.max(1, end - start) };
}

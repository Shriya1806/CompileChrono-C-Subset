import type { Production } from "../grammar/grammarTypes";
import type { Token } from "../../lexer/token";
import type { CompilerError } from "../../lexer/lexicalError";

export interface ParseTreeNode {
  id: string;
  symbol: string;
  symbolType: "terminal" | "nonTerminal" | "epsilon";
  productionId?: string;
  token?: Token;
  children: ParseTreeNode[];
  sourceRange?: {
    startOffset: number;
    endOffset: number;
    line: number;
    column: number;
    length: number;
  };
}

export enum ParserEventType {
  PARSER_STARTED = "PARSER_STARTED",
  STACK_PUSH = "STACK_PUSH",
  STACK_POP = "STACK_POP",
  TERMINAL_MATCH = "TERMINAL_MATCH",
  NONTERMINAL_EXPAND = "NONTERMINAL_EXPAND",
  PRODUCTION_SELECTED = "PRODUCTION_SELECTED",
  TOKEN_CONSUMED = "TOKEN_CONSUMED",
  PARSE_TREE_NODE_CREATED = "PARSE_TREE_NODE_CREATED",
  PARSE_TREE_EDGE_CREATED = "PARSE_TREE_EDGE_CREATED",
  SYNTAX_ERROR = "SYNTAX_ERROR",
  RECOVERY_STARTED = "RECOVERY_STARTED",
  RECOVERY_COMPLETED = "RECOVERY_COMPLETED",
  PARSER_ACCEPTED = "PARSER_ACCEPTED",
  PARSER_COMPLETED = "PARSER_COMPLETED"
}

export interface ParserEvent {
  id: string;
  type: ParserEventType;
  step: number;
  stackBefore: string[];
  stackAfter: string[];
  tokenIndex: number;
  lookahead: string;
  productionId?: string;
  production?: Production;
  parseTreeNodeId?: string;
  message: string;
  expected?: string[];
  sourceRange?: ParseTreeNode["sourceRange"];
}

export interface ParserStep {
  id: string;
  event: ParserEvent;
  stack: string[];
  tokenIndex: number;
  action: string;
  selectedProductionId?: string;
  selectedTableCell?: { nonTerminal: string; terminal: string };
  visibleParseTree: ParseTreeNode;
}

export interface ParseResult {
  accepted: boolean;
  root: ParseTreeNode;
  events: ParserEvent[];
  steps: ParserStep[];
  errors: CompilerError[];
}

export enum TokenType {
  KEYWORD = "KEYWORD",
  IDENTIFIER = "IDENTIFIER",
  INTEGER_LITERAL = "INTEGER_LITERAL",
  DECIMAL_LITERAL = "DECIMAL_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  BOOLEAN_LITERAL = "BOOLEAN_LITERAL",
  ASSIGN = "ASSIGN",
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",
  EQ = "EQ",
  NEQ = "NEQ",
  LT = "LT",
  LTE = "LTE",
  GT = "GT",
  GTE = "GTE",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  COMMA = "COMMA",
  SEMICOLON = "SEMICOLON",
  EOF = "EOF"
}

export const dataTypes = ["num", "dec", "text", "bool"] as const;
export const controlKeywords = ["if", "else", "while", "func", "return", "show"] as const;
export const booleanLiterals = ["true", "false"] as const;
export const keywords = [...dataTypes, ...controlKeywords] as const;

export type Keyword = (typeof keywords)[number];
export type BooleanLiteral = (typeof booleanLiterals)[number];

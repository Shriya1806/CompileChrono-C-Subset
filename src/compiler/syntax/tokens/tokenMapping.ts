import { TokenType } from "../../language/tokens";
import type { Token } from "../../lexer/token";
import { EOF_SYMBOL } from "../grammar/grammarTypes";

const keywordMap: Record<string, string> = {
  num: "NUM",
  dec: "DEC",
  text: "TEXT",
  bool: "BOOL",
  if: "IF",
  else: "ELSE",
  while: "WHILE",
  func: "FUNC",
  return: "RETURN",
  show: "SHOW"
};

export interface ParserToken {
  terminal: string;
  token: Token;
}

export function tokenToTerminal(token: Token): string {
  if (token.type === TokenType.EOF) return EOF_SYMBOL;
  if (token.type === TokenType.KEYWORD) return keywordMap[token.lexeme] ?? token.type;
  return token.type;
}

export function toParserTokens(tokens: Token[]): ParserToken[] {
  return tokens.map((token) => ({ token, terminal: tokenToTerminal(token) }));
}

import type { TokenType } from "../language/tokens";
import type { SourceRange } from "../snapshots/compilerEvent";

export interface Token {
  id: string;
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
  ruleId?: string;
}

export function tokenRange(token: Token): SourceRange {
  return {
    startOffset: token.startOffset,
    endOffset: token.endOffset,
    line: token.line,
    column: token.column,
    length: token.endOffset - token.startOffset
  };
}

import { lexicalRules } from "../language/lexicalRules";
import { TokenType } from "../language/tokens";
import { CompilerEventType, CompilerPhase, type SourceRange } from "../snapshots/compilerEvent";
import { SnapshotRecorder } from "../snapshots/snapshotRecorder";
import type { CompilerError } from "./lexicalError";
import type { LexerResult } from "./lexerTypes";
import { advanceCursor, type Cursor } from "./scanner";
import type { Token } from "./token";

interface Candidate {
  ruleId: string;
  tokenType: TokenType;
  lexeme: string;
  priority: number;
}

export function lex(source: string): LexerResult {
  const recorder = new SnapshotRecorder();
  const tokens: Token[] = [];
  const errors: CompilerError[] = [];
  let cursor: Cursor = { offset: 0, line: 1, column: 1 };

  recorder.record({
    type: CompilerEventType.LEXER_STARTED,
    phase: CompilerPhase.SOURCE,
    title: "Source loaded",
    description: "The source program was loaded.",
    input: source
  });

  while (cursor.offset < source.length) {
    const remaining = source.slice(cursor.offset);
    const currentChar = remaining[0];
    const start = { ...cursor };
    const range = rangeFrom(start, Math.max(1, currentChar.length));

    recorder.record({
      type: CompilerEventType.CHARACTER_READ,
      title: "Character read",
      description: `Read '${printable(currentChar)}' at line ${cursor.line}, column ${cursor.column}.`,
      sourceRange: range,
      metadata: { char: currentChar }
    });

    const whitespace = /^[\t\r\n ]+/.exec(remaining)?.[0];
    if (whitespace) {
      cursor = advanceCursor(cursor, whitespace);
      recorder.record({
        type: CompilerEventType.WHITESPACE_SKIPPED,
        title: "Whitespace skipped",
        description: `Skipped ${whitespace.length} whitespace character(s).`,
        sourceRange: rangeFrom(start, whitespace.length)
      });
      continue;
    }

    const comment = /^\/\/[^\n]*/.exec(remaining)?.[0];
    if (comment) {
      cursor = advanceCursor(cursor, comment);
      recorder.record({
        type: CompilerEventType.COMMENT_SKIPPED,
        title: "Comment skipped",
        description: "Skipped a single-line comment.",
        sourceRange: rangeFrom(start, comment.length)
      });
      continue;
    }

    if (currentChar === '"' && !/^"[^"\n]*"/.test(remaining)) {
      const length = unterminatedStringLength(remaining);
      const error = makeError(errors.length, "Unterminated string literal.", start, length, '"', remaining.slice(0, length));
      errors.push(error);
      recorder.record({
        type: CompilerEventType.LEXICAL_ERROR,
        title: "Lexical error",
        description: error.message,
        sourceRange: error.sourceRange,
        metadata: { error }
      });
      cursor = advanceCursor(cursor, remaining.slice(0, length));
      continue;
    }

    recorder.record({
      type: CompilerEventType.RULE_MATCH_STARTED,
      title: "Rule matching started",
      description: "Trying lexical rules using maximal munch and priority tie-breaking.",
      sourceRange: range
    });

    const candidate = chooseBestCandidate(remaining);
    if (!candidate) {
      const error = makeError(errors.length, `Unexpected character '${printable(currentChar)}'.`, start, 1, "valid token", currentChar);
      errors.push(error);
      recorder.record({
        type: CompilerEventType.LEXICAL_ERROR,
        title: "Lexical error",
        description: error.message,
        sourceRange: error.sourceRange,
        metadata: { error }
      });
      cursor = advanceCursor(cursor, currentChar);
      continue;
    }

    const token: Token = {
      id: `token-${tokens.length}`,
      type: candidate.tokenType,
      lexeme: candidate.lexeme,
      line: start.line,
      column: start.column,
      startOffset: start.offset,
      endOffset: start.offset + candidate.lexeme.length,
      ruleId: candidate.ruleId
    };
    tokens.push(token);
    const tokenSourceRange = rangeFrom(start, candidate.lexeme.length);

    recorder.record({
      type: CompilerEventType.TOKEN_RECOGNIZED,
      title: "Token recognized",
      description: `Characters '${candidate.lexeme}' matched ${candidate.tokenType}.`,
      sourceRange: tokenSourceRange,
      output: token,
      metadata: { token, lexeme: candidate.lexeme, ruleId: candidate.ruleId }
    });
    recorder.record({
      type: CompilerEventType.TOKEN_EMITTED,
      title: "Token emitted",
      description: `${candidate.tokenType} entered the token stream.`,
      sourceRange: tokenSourceRange,
      output: token,
      metadata: { token }
    });

    cursor = advanceCursor(cursor, candidate.lexeme);
  }

  tokens.push({
    id: `token-${tokens.length}`,
    type: TokenType.EOF,
    lexeme: "EOF",
    line: cursor.line,
    column: cursor.column,
    startOffset: cursor.offset,
    endOffset: cursor.offset
  });

  recorder.record({
    type: CompilerEventType.LEXER_COMPLETED,
    title: "Lexer completed",
    description: `Lexical analysis produced ${tokens.length - 1} token(s) and ${errors.length} error(s).`,
    output: { tokenCount: tokens.length, errorCount: errors.length }
  });

  return { tokens, errors, snapshots: recorder.snapshots, events: recorder.events };
}

function chooseBestCandidate(input: string): Candidate | null {
  const candidates: Candidate[] = [];
  for (const rule of lexicalRules) {
    const match = rule.matcher.exec(input);
    if (match?.[0]) {
      candidates.push({
        ruleId: rule.id,
        tokenType: rule.tokenType,
        lexeme: match[0],
        priority: rule.priority
      });
    }
  }
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.lexeme.length - a.lexeme.length || a.priority - b.priority)[0];
}

function rangeFrom(cursor: Cursor, length: number): SourceRange {
  return {
    startOffset: cursor.offset,
    endOffset: cursor.offset + length,
    line: cursor.line,
    column: cursor.column,
    length
  };
}

function makeError(index: number, message: string, cursor: Cursor, length: number, expected?: string, found?: string): CompilerError {
  return {
    id: `lexical-error-${index}`,
    phase: "LEXICAL",
    message,
    line: cursor.line,
    column: cursor.column,
    length,
    severity: "error",
    expected,
    found,
    sourceRange: rangeFrom(cursor, length)
  };
}

function unterminatedStringLength(input: string): number {
  const newline = input.indexOf("\n");
  return newline === -1 ? input.length : newline;
}

function printable(char: string): string {
  if (char === "\n") return "\\n";
  if (char === "\t") return "\\t";
  return char;
}

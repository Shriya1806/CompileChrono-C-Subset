import { describe, expect, it } from "vitest";
import { lex } from "../compiler/lexer/lexer";
import { samplePrograms } from "../compiler/language/examples";
import { TokenType } from "../compiler/language/tokens";

describe("lexer", () => {
  it("recognizes the Phase 1 acceptance program", () => {
    const result = lex("num result = value123 + 20;");
    expect(result.errors).toHaveLength(0);
    expect(result.tokens.map((token) => [token.lexeme, token.type])).toEqual([
      ["num", TokenType.KEYWORD],
      ["result", TokenType.IDENTIFIER],
      ["=", TokenType.ASSIGN],
      ["value123", TokenType.IDENTIFIER],
      ["+", TokenType.PLUS],
      ["20", TokenType.INTEGER_LITERAL],
      [";", TokenType.SEMICOLON],
      ["EOF", TokenType.EOF]
    ]);
  });

  it("recognizes keywords, booleans, strings, comments, and decimals", () => {
    const result = lex(`dec price = 99.5; // price\ntext product = "Book";\nbool available = true;`);
    expect(result.errors).toHaveLength(0);
    expect(result.tokens.map((token) => token.type)).toContain(TokenType.DECIMAL_LITERAL);
    expect(result.tokens.map((token) => token.type)).toContain(TokenType.STRING_LITERAL);
    expect(result.tokens.map((token) => token.type)).toContain(TokenType.BOOLEAN_LITERAL);
    expect(result.tokens.map((token) => token.lexeme)).not.toContain("// price");
  });

  it("tracks source locations after whitespace and comments", () => {
    const result = lex("num a = 10;\n// skip\nshow(a);");
    const show = result.tokens.find((token) => token.lexeme === "show");
    expect(show).toMatchObject({ line: 3, column: 1 });
  });

  it("uses longest match for multi-character operators", () => {
    const result = lex("if age >= 18 { show(\"Eligible\"); }");
    expect(result.tokens.find((token) => token.lexeme === ">=")?.type).toBe(TokenType.GTE);
  });

  it("reports invalid characters", () => {
    const result = lex("num x = 10 @ 20;");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ phase: "LEXICAL", line: 1, column: 12, found: "@" });
  });

  it("reports unterminated strings", () => {
    const result = lex('"unterminated string');
    expect(result.errors[0].message).toContain("Unterminated string");
  });

  it("tokenizes every bundled sample program without lexical errors", () => {
    for (const sample of samplePrograms) {
      const result = lex(sample.source);
      expect(result.errors, sample.name).toHaveLength(0);
      expect(result.tokens.at(-1)?.type).toBe(TokenType.EOF);
    }
  });
});

import { alternate, charClass, concat, literal, literalWord, plus, star } from "../automata/regex/regexAst";
import type { RegexNode } from "../automata/regex/regexAst";
import { TokenType, booleanLiterals, keywords } from "./tokens";

export interface LexicalRule {
  id: string;
  name: string;
  tokenType: TokenType;
  pattern: string;
  regex: RegexNode;
  priority: number;
  description: string;
  examples: string[];
  matcher: RegExp;
}

const digit = charClass("[0-9]", { ranges: [["0", "9"]] });
const letter = charClass("[A-Za-z_]", { ranges: [["A", "Z"], ["a", "z"]], chars: ["_"] });
const letterOrDigit = charClass("[A-Za-z0-9_]", { ranges: [["A", "Z"], ["a", "z"], ["0", "9"]], chars: ["_"] });
const stringChar = charClass("[^\"\\n]", { chars: ['"', "\n"], negate: true });

const operatorRules: Array<[string, string, TokenType, string, string[]]> = [
  ["eq", "Equality operator", TokenType.EQ, "==", ["=="]],
  ["neq", "Inequality operator", TokenType.NEQ, "!=", ["!="]],
  ["lte", "Less-than-or-equal operator", TokenType.LTE, "<=", ["<="]],
  ["gte", "Greater-than-or-equal operator", TokenType.GTE, ">=", [">="]],
  ["and", "Logical AND operator", TokenType.AND, "&&", ["&&"]],
  ["or", "Logical OR operator", TokenType.OR, "||", ["||"]],
  ["assign", "Assignment operator", TokenType.ASSIGN, "=", ["="]],
  ["plus", "Addition operator", TokenType.PLUS, "+", ["+"]],
  ["minus", "Subtraction operator", TokenType.MINUS, "-", ["-"]],
  ["star", "Multiplication operator", TokenType.STAR, "*", ["*"]],
  ["slash", "Division operator", TokenType.SLASH, "/", ["/"]],
  ["percent", "Remainder operator", TokenType.PERCENT, "%", ["%"]],
  ["lt", "Less-than operator", TokenType.LT, "<", ["<"]],
  ["gt", "Greater-than operator", TokenType.GT, ">", [">"]],
  ["not", "Logical NOT operator", TokenType.NOT, "!", ["!"]],
  ["lparen", "Left parenthesis", TokenType.LPAREN, "(", ["("]],
  ["rparen", "Right parenthesis", TokenType.RPAREN, ")", [")"]],
  ["lbrace", "Left brace", TokenType.LBRACE, "{", ["{"]],
  ["rbrace", "Right brace", TokenType.RBRACE, "}", ["}"]],
  ["comma", "Comma punctuation", TokenType.COMMA, ",", [","]],
  ["semicolon", "Statement terminator", TokenType.SEMICOLON, ";", [";"]]
];

function wordAlternation(values: readonly string[]): RegexNode {
  return alternate(...values.map(literalWord));
}

function escapedRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const lexicalRules: LexicalRule[] = [
  {
    id: "decimal",
    name: "Decimal Literal",
    tokenType: TokenType.DECIMAL_LITERAL,
    pattern: "[0-9]+\\.[0-9]+",
    regex: concat(plus(digit), literal("."), plus(digit)),
    priority: 10,
    description: "A base-10 number with digits on both sides of the decimal point.",
    examples: ["99.5", "3.14", "0.25"],
    matcher: /^[0-9]+\.[0-9]+/
  },
  {
    id: "integer",
    name: "Integer Literal",
    tokenType: TokenType.INTEGER_LITERAL,
    pattern: "[0-9]+",
    regex: plus(digit),
    priority: 20,
    description: "A whole base-10 numeric literal.",
    examples: ["10", "200", "0"],
    matcher: /^[0-9]+/
  },
  {
    id: "string",
    name: "String Literal",
    tokenType: TokenType.STRING_LITERAL,
    pattern: "\"[^\"\\n]*\"",
    regex: concat(literal('"'), star(stringChar), literal('"')),
    priority: 30,
    description: "Text enclosed in double quotes. New lines are not allowed inside Phase 1 strings.",
    examples: ['"Hello"', '"CompileChrono"'],
    matcher: /^"[^"\n]*"/
  },
  {
    id: "boolean",
    name: "Boolean Literal",
    tokenType: TokenType.BOOLEAN_LITERAL,
    pattern: "true|false",
    regex: wordAlternation(booleanLiterals),
    priority: 40,
    description: "A literal truth value.",
    examples: ["true", "false"],
    matcher: /^(true|false)\b/
  },
  {
    id: "keyword",
    name: "Keyword",
    tokenType: TokenType.KEYWORD,
    pattern: keywords.join("|"),
    regex: wordAlternation(keywords),
    priority: 50,
    description: "Reserved words for declarations, control flow, functions, and output.",
    examples: ["num", "while", "show"],
    matcher: new RegExp(`^(${keywords.map(escapedRegExpLiteral).join("|")})\\b`)
  },
  {
    id: "identifier",
    name: "Identifier",
    tokenType: TokenType.IDENTIFIER,
    pattern: "[A-Za-z_][A-Za-z0-9_]*",
    regex: concat(letter, star(letterOrDigit)),
    priority: 60,
    description: "A user-defined name starting with a letter or underscore, followed by letters, digits, or underscores.",
    examples: ["result", "value123", "_temp"],
    matcher: /^[A-Za-z_][A-Za-z0-9_]*/
  },
  ...operatorRules.map(([id, name, tokenType, symbol, examples], index): LexicalRule => ({
    id,
    name,
    tokenType,
    pattern: escapedRegExpLiteral(symbol),
    regex: literalWord(symbol),
    priority: 100 + index,
    description: name,
    examples,
    matcher: new RegExp(`^${escapedRegExpLiteral(symbol)}`)
  }))
].sort((a, b) => a.priority - b.priority);

export function getLexicalRule(ruleId: string): LexicalRule {
  const rule = lexicalRules.find((item) => item.id === ruleId);
  if (!rule) throw new Error(`Unknown lexical rule: ${ruleId}`);
  return rule;
}

export function getLexicalRuleForToken(tokenType: TokenType, ruleId?: string): LexicalRule | undefined {
  if (ruleId) return lexicalRules.find((rule) => rule.id === ruleId);
  return lexicalRules.find((rule) => rule.tokenType === tokenType);
}

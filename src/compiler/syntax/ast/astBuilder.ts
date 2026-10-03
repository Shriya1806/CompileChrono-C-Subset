import { TokenType } from "../../language/tokens";
import type { Token } from "../../lexer/token";
import { tokenToTerminal } from "../tokens/tokenMapping";
import { mergeRanges, tokenRange, type AstNode, type BlockNode, type IdentifierNode, type ParameterNode, type ProgramNode } from "./astTypes";

class AstParser {
  private index = 0;
  private nodeIndex = 0;

  constructor(private readonly tokens: Token[]) {}

  parseProgram(): ProgramNode {
    const body: AstNode[] = [];
    while (!this.check("EOF")) body.push(this.parseStatement());
    return { id: this.id(), kind: "Program", body, sourceRange: mergeRanges(...body.map((node) => node.sourceRange)) };
  }

  private parseStatement(): AstNode {
    if (this.isType()) return this.parseDeclaration();
    if (this.match("IDENTIFIER")) {
      const identifier = this.identifier(this.previous());
      if (this.match("ASSIGN")) {
        const value = this.parseExpression();
        const semi = this.consume("SEMICOLON");
        return { id: this.id(), kind: "Assignment", target: identifier, value, sourceRange: mergeRanges(identifier.sourceRange, value.sourceRange, tokenRange(semi)) };
      }
      const call = this.finishCall(identifier);
      const semi = this.consume("SEMICOLON");
      return { ...call, sourceRange: mergeRanges(call.sourceRange, tokenRange(semi)) };
    }
    if (this.match("SHOW")) return this.parseShow(this.previous());
    if (this.match("IF")) return this.parseIf(this.previous());
    if (this.match("WHILE")) return this.parseWhile(this.previous());
    if (this.match("FUNC")) return this.parseFunction(this.previous());
    if (this.match("RETURN")) return this.parseReturn(this.previous());
    if (this.match("LBRACE")) return this.parseBlock(this.previous());
    throw new Error(`Unexpected token in AST builder: ${this.peek().lexeme}`);
  }

  private parseDeclaration(): AstNode {
    const typeToken = this.advance();
    const name = this.consume("IDENTIFIER");
    let initializer: AstNode | undefined;
    if (this.match("ASSIGN")) initializer = this.parseExpression();
    const semi = this.consume("SEMICOLON");
    return {
      id: this.id(),
      kind: "VariableDeclaration",
      valueType: typeToken.lexeme,
      name: name.lexeme,
      initializer,
      sourceRange: mergeRanges(tokenRange(typeToken), initializer?.sourceRange, tokenRange(semi))
    };
  }

  private parseShow(show: Token): AstNode {
    this.consume("LPAREN");
    const expression = this.parseExpression();
    this.consume("RPAREN");
    const semi = this.consume("SEMICOLON");
    return { id: this.id(), kind: "ShowStatement", expression, sourceRange: mergeRanges(tokenRange(show), expression.sourceRange, tokenRange(semi)) };
  }

  private parseIf(ifToken: Token): AstNode {
    const condition = this.parseExpression();
    const thenBranch = this.parseBlock(this.consume("LBRACE"));
    let elseBranch: BlockNode | undefined;
    if (this.match("ELSE")) elseBranch = this.parseBlock(this.consume("LBRACE"));
    return { id: this.id(), kind: "IfStatement", condition, thenBranch, elseBranch, sourceRange: mergeRanges(tokenRange(ifToken), condition.sourceRange, thenBranch.sourceRange, elseBranch?.sourceRange) };
  }

  private parseWhile(whileToken: Token): AstNode {
    const condition = this.parseExpression();
    const body = this.parseBlock(this.consume("LBRACE"));
    return { id: this.id(), kind: "WhileStatement", condition, body, sourceRange: mergeRanges(tokenRange(whileToken), condition.sourceRange, body.sourceRange) };
  }

  private parseFunction(func: Token): AstNode {
    const returnType = this.isType() ? this.advance().lexeme : "void";
    const name = this.consume("IDENTIFIER");
    this.consume("LPAREN");
    const params: ParameterNode[] = [];
    if (!this.check("RPAREN")) {
      do {
        const typeToken = this.advance();
        const paramName = this.consume("IDENTIFIER");
        params.push({ id: this.id(), kind: "Parameter", valueType: typeToken.lexeme, name: paramName.lexeme, sourceRange: mergeRanges(tokenRange(typeToken), tokenRange(paramName)) });
      } while (this.match("COMMA"));
    }
    this.consume("RPAREN");
    const body = this.parseBlock(this.consume("LBRACE"));
    return { id: this.id(), kind: "FunctionDeclaration", name: name.lexeme, returnType, params, body, sourceRange: mergeRanges(tokenRange(func), tokenRange(name), body.sourceRange) };
  }

  private parseReturn(returnToken: Token): AstNode {
    const value = this.check("SEMICOLON") ? undefined : this.parseExpression();
    const semi = this.consume("SEMICOLON");
    return { id: this.id(), kind: "ReturnStatement", value, sourceRange: mergeRanges(tokenRange(returnToken), value?.sourceRange, tokenRange(semi)) };
  }

  private parseBlock(open: Token): BlockNode {
    const body: AstNode[] = [];
    while (!this.check("RBRACE")) body.push(this.parseStatement());
    const close = this.consume("RBRACE");
    return { id: this.id(), kind: "Block", body, sourceRange: mergeRanges(tokenRange(open), ...body.map((node) => node.sourceRange), tokenRange(close)) };
  }

  private parseExpression(): AstNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): AstNode {
    let expr = this.parseLogicalAnd();
    while (this.match("OR")) expr = this.binary(expr, this.previous(), this.parseLogicalAnd());
    return expr;
  }

  private parseLogicalAnd(): AstNode {
    let expr = this.parseEquality();
    while (this.match("AND")) expr = this.binary(expr, this.previous(), this.parseEquality());
    return expr;
  }

  private parseEquality(): AstNode {
    let expr = this.parseComparison();
    while (this.match("EQ", "NEQ")) expr = this.binary(expr, this.previous(), this.parseComparison());
    return expr;
  }

  private parseComparison(): AstNode {
    let expr = this.parseTerm();
    while (this.match("LT", "LTE", "GT", "GTE")) expr = this.binary(expr, this.previous(), this.parseTerm());
    return expr;
  }

  private parseTerm(): AstNode {
    let expr = this.parseFactor();
    while (this.match("PLUS", "MINUS")) expr = this.binary(expr, this.previous(), this.parseFactor());
    return expr;
  }

  private parseFactor(): AstNode {
    let expr = this.parseUnary();
    while (this.match("STAR", "SLASH", "PERCENT")) expr = this.binary(expr, this.previous(), this.parseUnary());
    return expr;
  }

  private parseUnary(): AstNode {
    if (this.match("NOT", "MINUS")) {
      const operator = this.previous();
      const argument = this.parseUnary();
      return { id: this.id(), kind: "UnaryExpression", operator: operator.lexeme, argument, sourceRange: mergeRanges(tokenRange(operator), argument.sourceRange) };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    if (this.match("INTEGER_LITERAL", "DECIMAL_LITERAL", "STRING_LITERAL", "BOOLEAN_LITERAL")) {
      const token = this.previous();
      return {
        id: this.id(),
        kind: "Literal",
        value: token.lexeme,
        literalType: literalType(token),
        sourceRange: tokenRange(token)
      };
    }
    if (this.match("IDENTIFIER")) {
      const identifier = this.identifier(this.previous());
      if (this.check("LPAREN")) return this.finishCall(identifier);
      return identifier;
    }
    if (this.match("LPAREN")) {
      const expression = this.parseExpression();
      this.consume("RPAREN");
      return expression;
    }
    throw new Error(`Expected expression, found ${this.peek().lexeme}`);
  }

  private finishCall(callee: IdentifierNode): AstNode {
    this.consume("LPAREN");
    const args: AstNode[] = [];
    if (!this.check("RPAREN")) {
      do args.push(this.parseExpression());
      while (this.match("COMMA"));
    }
    const close = this.consume("RPAREN");
    return { id: this.id(), kind: "FunctionCall", callee, args, sourceRange: mergeRanges(callee.sourceRange, ...args.map((arg) => arg.sourceRange), tokenRange(close)) };
  }

  private binary(left: AstNode, operator: Token, right: AstNode): AstNode {
    return { id: this.id(), kind: "BinaryExpression", operator: operator.lexeme, left, right, sourceRange: mergeRanges(left.sourceRange, tokenRange(operator), right.sourceRange) };
  }

  private identifier(token: Token): IdentifierNode {
    return { id: this.id(), kind: "Identifier", name: token.lexeme, sourceRange: tokenRange(token) };
  }

  private isType(): boolean {
    return ["NUM", "DEC", "TEXT", "BOOL"].includes(this.terminal());
  }

  private match(...terminals: string[]): boolean {
    if (!terminals.includes(this.terminal())) return false;
    this.advance();
    return true;
  }

  private consume(terminal: string): Token {
    if (this.check(terminal)) return this.advance();
    throw new Error(`Expected ${terminal}, found ${this.peek().lexeme}`);
  }

  private check(terminal: string): boolean {
    return this.terminal() === terminal;
  }

  private terminal(): string {
    return tokenToTerminal(this.peek());
  }

  private peek(): Token {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }

  private advance(): Token {
    if (this.index < this.tokens.length) this.index += 1;
    return this.previous();
  }

  private id(): string {
    return `ast-node-${this.nodeIndex++}`;
  }
}

export function buildAst(tokens: Token[]): ProgramNode {
  return new AstParser(tokens.filter((token) => token.type !== TokenType.EOF).concat(tokens.find((token) => token.type === TokenType.EOF)!)).parseProgram();
}

function literalType(token: Token) {
  if (token.type === TokenType.INTEGER_LITERAL) return "integer";
  if (token.type === TokenType.DECIMAL_LITERAL) return "decimal";
  if (token.type === TokenType.STRING_LITERAL) return "string";
  return "boolean";
}

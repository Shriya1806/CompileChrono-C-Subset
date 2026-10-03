import type { CompilerError } from "../../lexer/lexicalError";
import type { Token } from "../../lexer/token";
import { EOF_SYMBOL, EPSILON, type GrammarSymbol } from "../grammar/grammarTypes";
import type { LL1ParsingTable } from "../table/ll1Table";
import { toParserTokens } from "../tokens/tokenMapping";
import { ParserEventType, type ParseResult, type ParseTreeNode, type ParserEvent, type ParserStep } from "./parserTypes";
import type { Grammar } from "../grammar/grammarTypes";
import type { FollowSets } from "../sets/follow";

interface StackEntry {
  symbol: GrammarSymbol;
  node: ParseTreeNode;
}

export function parseTokens(tokens: Token[], grammar: Grammar, table: LL1ParsingTable, followSets: FollowSets): ParseResult {
  const parserTokens = toParserTokens(tokens);
  let nodeIndex = 0;
  let eventIndex = 0;
  let tokenIndex = 0;
  const root = node(grammar.startSymbol, "nonTerminal");
  const stack: StackEntry[] = [
    { symbol: { kind: "terminal", name: EOF_SYMBOL }, node: node(EOF_SYMBOL, "terminal") },
    { symbol: { kind: "nonTerminal", name: grammar.startSymbol }, node: root }
  ];
  const events: ParserEvent[] = [];
  const steps: ParserStep[] = [];
  const errors: CompilerError[] = [];

  record(ParserEventType.PARSER_STARTED, [], stackLabels(), "Parser started.");

  while (stack.length > 0) {
    const before = stackLabels();
    const top = stack.pop()!;
    const lookahead = parserTokens[tokenIndex] ?? parserTokens[parserTokens.length - 1];

    record(ParserEventType.STACK_POP, before, stackLabels(), `Popped ${top.symbol.name}.`, undefined, top.node.id);

    if (top.symbol.kind === "epsilon") continue;

    if (top.symbol.kind === "terminal") {
      if (top.symbol.name === lookahead.terminal) {
        top.node.token = lookahead.token;
        top.node.sourceRange = rangeFromToken(lookahead.token);
        record(ParserEventType.TERMINAL_MATCH, before, stackLabels(), `Matched ${top.symbol.name}.`, undefined, top.node.id);
        tokenIndex += 1;
        record(ParserEventType.TOKEN_CONSUMED, before, stackLabels(), `Consumed ${lookahead.token.lexeme}.`, undefined, top.node.id);
        if (top.symbol.name === EOF_SYMBOL) {
          record(ParserEventType.PARSER_ACCEPTED, before, stackLabels(), "Input accepted.");
          break;
        }
      } else {
        const error = syntaxError(errors.length, lookahead.token, [top.symbol.name], top.symbol.name, before, tokenIndex);
        errors.push(error);
        record(ParserEventType.SYNTAX_ERROR, before, stackLabels(), error.message, undefined, top.node.id, [top.symbol.name]);
        if (lookahead.terminal !== EOF_SYMBOL) tokenIndex += 1;
      }
      continue;
    }

    const production = table.cells[top.symbol.name]?.[lookahead.terminal];
    if (!production) {
      const expected = Object.keys(table.cells[top.symbol.name] ?? {}).sort();
      const error = syntaxError(errors.length, lookahead.token, expected, top.symbol.name, before, tokenIndex);
      errors.push(error);
      record(ParserEventType.SYNTAX_ERROR, before, stackLabels(), error.message, undefined, top.node.id, expected);
      record(ParserEventType.RECOVERY_STARTED, before, stackLabels(), `Panic-mode recovery for ${top.symbol.name}.`, undefined, top.node.id);
      const sync = followSets[top.symbol.name] ?? new Set([EOF_SYMBOL]);
      while (tokenIndex < parserTokens.length - 1 && !sync.has(parserTokens[tokenIndex].terminal)) tokenIndex += 1;
      record(ParserEventType.RECOVERY_COMPLETED, before, stackLabels(), `Synchronized at ${parserTokens[tokenIndex]?.terminal ?? EOF_SYMBOL}.`, undefined, top.node.id);
      continue;
    }

    top.node.productionId = production.id;
    record(ParserEventType.PRODUCTION_SELECTED, before, stackLabels(), `Applying ${production.label}.`, production, top.node.id);
    const childSymbols = production.rhs;
    const children = childSymbols.map((symbol) => node(symbol.name, symbol.kind));
    top.node.children.push(...children);
    for (const child of children) {
      record(ParserEventType.PARSE_TREE_NODE_CREATED, before, stackLabels(), `Created parse-tree node ${child.symbol}.`, production, child.id);
      record(ParserEventType.PARSE_TREE_EDGE_CREATED, before, stackLabels(), `Linked ${top.node.symbol} -> ${child.symbol}.`, production, child.id);
    }
    const pushEntries = childSymbols
      .map((symbol, index) => ({ symbol, node: children[index] }))
      .filter((entry) => entry.symbol.kind !== "epsilon")
      .reverse();
    for (const entry of pushEntries) {
      stack.push(entry);
      record(ParserEventType.STACK_PUSH, before, stackLabels(), `Pushed ${entry.symbol.name}.`, production, entry.node.id);
    }
    record(ParserEventType.NONTERMINAL_EXPAND, before, stackLabels(), `Expanded ${top.symbol.name}.`, production, top.node.id);
  }

  record(ParserEventType.PARSER_COMPLETED, stackLabels(), stackLabels(), errors.length === 0 ? "Parser completed successfully." : "Parser completed with syntax errors.");
  annotateRanges(root);
  return { accepted: errors.length === 0, root, events, steps, errors };

  function node(symbol: string, symbolType: ParseTreeNode["symbolType"]): ParseTreeNode {
    return { id: `parse-node-${nodeIndex++}`, symbol, symbolType, children: [] };
  }

  function stackLabels() {
    return stack.map((entry) => entry.symbol.name);
  }

  function record(
    type: ParserEventType,
    stackBefore: string[],
    stackAfter: string[],
    message: string,
    production?: ParserEvent["production"],
    parseTreeNodeId?: string,
    expected?: string[]
  ) {
    const lookahead = parserTokens[tokenIndex] ?? parserTokens[parserTokens.length - 1];
    const event: ParserEvent = {
      id: `parser-event-${eventIndex}`,
      type,
      step: eventIndex,
      stackBefore,
      stackAfter,
      tokenIndex,
      lookahead: lookahead?.terminal ?? EOF_SYMBOL,
      productionId: production?.id,
      production,
      parseTreeNodeId,
      message,
      expected,
      sourceRange: lookahead ? rangeFromToken(lookahead.token) : undefined
    };
    events.push(event);
    steps.push({
      id: `parser-step-${eventIndex}`,
      event,
      stack: [...stackAfter],
      tokenIndex,
      action: message,
      selectedProductionId: production?.id,
      selectedTableCell: production ? { nonTerminal: production.lhs, terminal: event.lookahead } : undefined,
      visibleParseTree: cloneTree(root)
    });
    eventIndex += 1;
  }
}

function syntaxError(index: number, token: Token, expected: string[], currentNonTerminal: string, stackSnapshot: string[], tokenIndex: number): CompilerError {
  return {
    id: `syntax-error-${index}`,
    phase: "SYNTAX",
    message: `Unexpected ${token.lexeme}; expected ${expected.join(", ")}.`,
    line: token.line,
    column: token.column,
    length: Math.max(1, token.endOffset - token.startOffset),
    severity: "error",
    expected,
    found: token.lexeme,
    sourceRange: rangeFromToken(token),
    parserState: { currentNonTerminal, stackSnapshot, tokenIndex }
  };
}

function rangeFromToken(token: Token) {
  return {
    startOffset: token.startOffset,
    endOffset: token.endOffset,
    line: token.line,
    column: token.column,
    length: Math.max(1, token.endOffset - token.startOffset)
  };
}

function annotateRanges(node: ParseTreeNode): ParseTreeNode["sourceRange"] | undefined {
  if (node.token) return node.sourceRange;
  const childRanges = node.children.map(annotateRanges).filter(Boolean) as NonNullable<ParseTreeNode["sourceRange"]>[];
  if (childRanges.length === 0) return node.sourceRange;
  const start = Math.min(...childRanges.map((range) => range.startOffset));
  const end = Math.max(...childRanges.map((range) => range.endOffset));
  const first = childRanges.find((range) => range.startOffset === start)!;
  node.sourceRange = { startOffset: start, endOffset: end, line: first.line, column: first.column, length: Math.max(1, end - start) };
  return node.sourceRange;
}

function cloneTree(node: ParseTreeNode): ParseTreeNode {
  return {
    ...node,
    children: node.children.map(cloneTree),
    token: node.token ? { ...node.token } : undefined,
    sourceRange: node.sourceRange ? { ...node.sourceRange } : undefined
  };
}

import type { CompilerSnapshot } from "../snapshots/compilerSnapshot";
import { CompilerEventType, CompilerPhase } from "../snapshots/compilerEvent";
import { SnapshotRecorder } from "../snapshots/snapshotRecorder";
import type { Token } from "../lexer/token";
import { buildAst } from "./ast/astBuilder";
import type { ProgramNode } from "./ast/astTypes";
import { miniGrammar } from "./grammar/miniGrammar";
import { validateGrammar } from "./grammar/validateGrammar";
import { computeNullable, type NullableSets } from "./sets/nullable";
import { computeFirstSets, type FirstSets } from "./sets/first";
import { computeFollowSets, type FollowSets } from "./sets/follow";
import { buildLL1ParsingTable, type LL1ParsingTable } from "./table/ll1Table";
import { parseTokens } from "./parser/predictiveParser";
import type { ParseResult } from "./parser/parserTypes";

export interface SyntaxAnalysisResult {
  grammar: typeof miniGrammar;
  diagnostics: ReturnType<typeof validateGrammar>;
  nullable: NullableSets;
  firstSets: FirstSets;
  followSets: FollowSets;
  parsingTable: LL1ParsingTable;
  parseResult: ParseResult;
  ast: ProgramNode | null;
  snapshots: CompilerSnapshot[];
}

export function analyzeSyntax(tokens: Token[]): SyntaxAnalysisResult {
  const recorder = new SnapshotRecorder();
  recorder.record({
    type: CompilerEventType.SYNTAX_START,
    phase: CompilerPhase.SYNTAX,
    title: "Syntax analysis started",
    description: "Grammar, FIRST/FOLLOW sets, parsing table, and predictive parser are being prepared."
  });

  const diagnostics = validateGrammar(miniGrammar);
  recorder.record({
    type: CompilerEventType.GRAMMAR_READY,
    phase: CompilerPhase.SYNTAX,
    title: "Grammar loaded",
    description: `${miniGrammar.productions.length} productions loaded with ${diagnostics.length} diagnostic(s).`,
    output: { diagnostics }
  });

  const nullable = computeNullable(miniGrammar);
  recorder.record({
    type: CompilerEventType.NULLABLE_COMPUTED,
    phase: CompilerPhase.SYNTAX,
    title: "Nullable sets computed",
    description: "Nullable non-terminals were computed from grammar productions.",
    output: serializeSetRecord(nullable)
  });

  const firstSets = computeFirstSets(miniGrammar);
  recorder.record({
    type: CompilerEventType.FIRST_COMPUTED,
    phase: CompilerPhase.SYNTAX,
    title: "FIRST sets computed",
    description: "FIRST sets reached a fixed point.",
    output: serializeSetRecord(firstSets)
  });

  const followSets = computeFollowSets(miniGrammar, firstSets);
  recorder.record({
    type: CompilerEventType.FOLLOW_COMPUTED,
    phase: CompilerPhase.SYNTAX,
    title: "FOLLOW sets computed",
    description: "FOLLOW sets reached a fixed point.",
    output: serializeSetRecord(followSets)
  });

  const parsingTable = buildLL1ParsingTable(miniGrammar, firstSets, followSets);
  recorder.record({
    type: CompilerEventType.PARSING_TABLE_READY,
    phase: CompilerPhase.SYNTAX,
    title: "LL(1) table ready",
    description: `Parsing table generated with ${parsingTable.conflicts.length} conflict(s).`,
    output: { conflicts: parsingTable.conflicts }
  });

  const parseResult = parseTokens(tokens, miniGrammar, parsingTable, followSets);
  for (const step of parseResult.steps) {
    recorder.record({
      type:
        step.event.type === "SYNTAX_ERROR"
          ? CompilerEventType.SYNTAX_ERROR
          : step.event.type === "TERMINAL_MATCH"
            ? CompilerEventType.TOKEN_MATCHED
            : step.event.type === "PRODUCTION_SELECTED"
              ? CompilerEventType.PRODUCTION_APPLIED
              : CompilerEventType.PARSER_STEP,
      phase: CompilerPhase.SYNTAX,
      title: step.event.type,
      description: step.action,
      sourceRange: step.event.sourceRange,
      metadata: {
        parserStep: step,
        stack: step.stack,
        tokenIndex: step.tokenIndex,
        selectedProductionId: step.selectedProductionId,
        selectedTableCell: step.selectedTableCell
      }
    });
  }

  const ast = parseResult.accepted ? buildAst(tokens) : null;
  if (ast) {
    recorder.record({
      type: CompilerEventType.AST_NODE_CREATED,
      phase: CompilerPhase.SYNTAX,
      title: "AST created",
      description: "Parse tree was abstracted into semantic AST nodes.",
      output: ast
    });
  }

  recorder.record({
    type: CompilerEventType.SYNTAX_COMPLETE,
    phase: CompilerPhase.SYNTAX,
    title: "Syntax analysis complete",
    description: parseResult.accepted ? "Predictive parser accepted the token stream." : "Syntax analysis completed with errors.",
    output: { accepted: parseResult.accepted, errorCount: parseResult.errors.length }
  });

  return { grammar: miniGrammar, diagnostics, nullable, firstSets, followSets, parsingTable, parseResult, ast, snapshots: recorder.snapshots };
}

function serializeSetRecord(record: Record<string, Set<string> | boolean>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Set ? [...value].sort() : value]));
}

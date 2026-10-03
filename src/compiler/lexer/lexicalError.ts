import type { SourceRange } from "../snapshots/compilerEvent";

export interface CompilerError {
  id: string;
  phase: "LEXICAL" | "SYNTAX" | "SEMANTIC" | "IR";
  code?: string;
  message: string;
  line: number;
  column: number;
  length: number;
  severity: "error" | "warning";
  expected?: string | string[];
  actual?: string;
  found?: string;
  symbolName?: string;
  scopeId?: string;
  relatedLocation?: SourceRange;
  sourceRange: SourceRange;
  parserState?: {
    currentNonTerminal?: string;
    stackSnapshot?: string[];
    tokenIndex?: number;
    recovery?: string[];
  };
}

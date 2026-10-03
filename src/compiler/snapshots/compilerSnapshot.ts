import type { CompilerEvent, CompilerPhase, SourceRange } from "./compilerEvent";

export interface CompilerSnapshot {
  id: string;
  phase: CompilerPhase;
  step: number;
  title: string;
  description: string;
  order: number;
  sourceRange?: SourceRange;
  input?: unknown;
  output?: unknown;
  event: CompilerEvent;
  metadata?: Record<string, unknown>;
}

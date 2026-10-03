import type { BackendResult } from "../backend/backendPipeline";
import type { CompileResult } from "../compile";
import type { CompilerSnapshot } from "../snapshots/compilerSnapshot";
import type { CompilerPhase } from "../snapshots/compilerEvent";
import type { RuntimeSession } from "../runtime/runtimeTypes";
import type { TraceMap } from "./traceMap";

export type StageStatus = "NOT_STARTED" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export interface PhaseStatus {
  phase: CompilerPhase;
  status: StageStatus;
  eventCount: number;
  errorCount: number;
  summary: string;
}

export interface CompilationSession {
  id: string;
  source: string;
  createdAt: string;
  result: CompileResult;
  backend: BackendResult | null;
  runtime: RuntimeSession | null;
  snapshots: CompilerSnapshot[];
  phaseStatuses: PhaseStatus[];
  traceMap: TraceMap;
  summary: {
    accepted: boolean;
    tokenCount: number;
    errorCount: number;
    targetInstructionCount: number;
    runtimeOutput: string[];
  };
}

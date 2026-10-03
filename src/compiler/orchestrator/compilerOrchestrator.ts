import { compileSource, type CompileResult } from "../compile";
import { CompilerEventType, CompilerPhase } from "../snapshots/compilerEvent";
import type { CompilerSnapshot } from "../snapshots/compilerSnapshot";
import { SnapshotRecorder } from "../snapshots/snapshotRecorder";
import { simulateRuntime } from "../runtime/runtimeSimulator";
import type { CompilationSession, PhaseStatus } from "./sessionTypes";
import { buildTraceMap } from "./traceMap";
import type { LanguageMode } from "../language/cSubset";

const PHASES = [
  CompilerPhase.SOURCE,
  CompilerPhase.LEXICAL,
  CompilerPhase.SYNTAX,
  CompilerPhase.SEMANTIC,
  CompilerPhase.IR,
  CompilerPhase.MACHINE_INDEPENDENT_OPTIMIZATION,
  CompilerPhase.CODE_GENERATION,
  CompilerPhase.MACHINE_DEPENDENT_OPTIMIZATION,
  CompilerPhase.TARGET,
  CompilerPhase.RUNTIME
];

export function compileWithOrchestration(source: string, language: LanguageMode = "mini"): CompilationSession {
  const result = compileSource(source, language) as CompileResult;
  const finalTarget = result.backend?.machineOptimization.finalTarget ?? [];
  const runtime = finalTarget.length > 0 && result.allErrors.length === 0 ? simulateRuntime(finalTarget, result.semantic) : null;
  const runtimeSnapshots = runtime ? snapshotsFromRuntime(runtime.events) : [];
  const snapshots = renumberSnapshots([...result.snapshots, ...runtimeSnapshots]);
  const traceMap = buildTraceMap(result);
  return {
    id: `session-${Date.now().toString(36)}`,
    source,
    createdAt: new Date().toISOString(),
    result,
    backend: result.backend,
    runtime,
    snapshots,
    phaseStatuses: buildPhaseStatuses(result, snapshots, runtime !== null),
    traceMap,
    summary: {
      accepted: result.allErrors.length === 0,
      tokenCount: result.tokens.filter((token) => token.type !== "EOF").length,
      errorCount: result.allErrors.length,
      targetInstructionCount: finalTarget.length,
      runtimeOutput: runtime?.finalState.output ?? []
    }
  };
}

function buildPhaseStatuses(result: CompileResult, snapshots: CompilerSnapshot[], hasRuntime: boolean): PhaseStatus[] {
  const failedPhase = result.allErrors[0]?.phase as CompilerPhase | undefined;
  return PHASES.map((phase) => {
    const eventCount = snapshots.filter((snapshot) => snapshot.phase === phase).length;
    const errorCount = result.allErrors.filter((error) => error.phase === phase).length;
    let status: PhaseStatus["status"] = eventCount > 0 ? "SUCCESS" : "SKIPPED";
    if (phase === CompilerPhase.RUNTIME && !hasRuntime) status = result.allErrors.length > 0 ? "SKIPPED" : "SUCCESS";
    if (failedPhase === phase || errorCount > 0) status = "FAILED";
    if (failedPhase && PHASES.indexOf(phase) > PHASES.indexOf(failedPhase)) status = "SKIPPED";
    return {
      phase,
      status,
      eventCount,
      errorCount,
      summary: summaryForPhase(phase, status, eventCount)
    };
  });
}

function summaryForPhase(phase: CompilerPhase, status: PhaseStatus["status"], eventCount: number) {
  if (status === "FAILED") return `${phase} reported a blocking diagnostic.`;
  if (status === "SKIPPED") return `${phase} waits for prior phases to succeed.`;
  return `${phase} completed with ${eventCount} recorded event(s).`;
}

function snapshotsFromRuntime(events: ReturnType<typeof simulateRuntime>["events"]): CompilerSnapshot[] {
  const recorder = new SnapshotRecorder();
  for (const event of events) {
    recorder.record({
      type: CompilerEventType[event.type],
      phase: CompilerPhase.RUNTIME,
      title: titleForRuntimeEvent(event.type),
      description: event.message,
      output: event.state,
      metadata: { runtimeEvent: event }
    });
  }
  return recorder.snapshots;
}

function titleForRuntimeEvent(type: string) {
  if (type === "RUNTIME_STARTED") return "Runtime started";
  if (type === "RUNTIME_OUTPUT_EMITTED") return "Runtime output emitted";
  if (type === "RUNTIME_HALTED") return "Runtime halted";
  if (type === "RUNTIME_ERROR") return "Runtime error";
  return "Runtime instruction executed";
}

function renumberSnapshots(snapshots: CompilerSnapshot[]): CompilerSnapshot[] {
  return snapshots.map((snapshot, index) => ({
    ...snapshot,
    step: index,
    order: index,
    event: { ...snapshot.event, order: index }
  }));
}

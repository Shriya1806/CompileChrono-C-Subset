import { CompilerEventType, CompilerPhase, type CompilerEvent, type SourceRange } from "./compilerEvent";
import type { CompilerSnapshot } from "./compilerSnapshot";

export class SnapshotRecorder {
  private order = 0;
  readonly events: CompilerEvent[] = [];
  readonly snapshots: CompilerSnapshot[] = [];

  record(args: {
    type: CompilerEventType;
    phase?: CompilerPhase;
    title: string;
    description: string;
    sourceRange?: SourceRange;
    input?: unknown;
    output?: unknown;
    payload?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    const order = this.order++;
    const event: CompilerEvent = {
      id: `event-${order}`,
      type: args.type,
      phase: args.phase ?? CompilerPhase.LEXICAL,
      order,
      sourceRange: args.sourceRange,
      payload: args.payload
    };
    const snapshot: CompilerSnapshot = {
      id: `snapshot-${order}`,
      phase: event.phase,
      step: order,
      title: args.title,
      description: args.description,
      order,
      sourceRange: args.sourceRange,
      input: args.input,
      output: args.output,
      event,
      metadata: args.metadata
    };
    this.events.push(event);
    this.snapshots.push(snapshot);
    return snapshot;
  }
}

import type { IrInstruction } from "../../ir/irTypes";
import { algebraicSimplificationPass, constantFoldingPass, constantPropagationPass, copyPropagationPass, csePass, deadCodeEliminationPass, unreachableCodeEliminationPass } from "./passes";
import type { OptimizationEvent, OptimizationPass, OptimizationPipelineResult } from "./optimizationTypes";

export const optimizationPasses: OptimizationPass[] = [
  constantFoldingPass,
  constantPropagationPass,
  copyPropagationPass,
  algebraicSimplificationPass,
  csePass,
  deadCodeEliminationPass,
  unreachableCodeEliminationPass
];

export function optimizeIr(instructions: IrInstruction[]): OptimizationPipelineResult {
  let current = instructions.map((instruction) => ({ ...instruction }));
  const events: OptimizationEvent[] = [];
  const statistics: Record<string, number> = {};
  let eventIndex = 0;
  const emit = (event: Omit<OptimizationEvent, "id" | "instructionsAfter">, after = current) => {
    events.push({ ...event, id: `opt-event-${eventIndex++}`, instructionsAfter: after.map((instruction) => ({ ...instruction })) });
  };

  emit({ type: "OPTIMIZATION_STARTED", reason: "Machine-independent optimization started." });
  for (const pass of optimizationPasses) {
    emit({ type: "PASS_STARTED", passId: pass.id, reason: pass.description });
    const result = pass.apply(current, emit);
    current = result.optimizedIR;
    Object.entries(result.statistics).forEach(([key, value]) => {
      statistics[`${pass.id}.${key}`] = value;
    });
    emit({ type: "PASS_COMPLETED", passId: pass.id, reason: `${pass.name} completed. Changed: ${result.changed}.` });
  }
  emit({ type: "OPTIMIZATION_COMPLETED", reason: "Optimization pipeline completed." });

  return { originalIR: instructions, optimizedIR: current, events, statistics };
}

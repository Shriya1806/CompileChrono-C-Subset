import { buildBasicBlocks, type BasicBlock } from "./basicBlocks";
import { buildControlFlowGraph, type ControlFlowGraph } from "./cfg";
import { optimizeIr } from "./optimization/optimizer";
import type { OptimizationPipelineResult } from "./optimization/optimizationTypes";
import { generateTarget } from "./target/codeGenerator";
import { optimizeTarget } from "./target/peephole";
import type { MachineOptimizationResult, TargetProgram } from "./target/targetTypes";
import type { IrInstruction } from "../ir/irTypes";

export interface BackendResult {
  basicBlocks: BasicBlock[];
  cfg: ControlFlowGraph;
  optimization: OptimizationPipelineResult;
  target: TargetProgram;
  machineOptimization: MachineOptimizationResult;
}

export function runBackend(instructions: IrInstruction[]): BackendResult {
  const basicBlocks = buildBasicBlocks(instructions);
  const cfg = buildControlFlowGraph(instructions);
  const optimization = optimizeIr(instructions);
  const target = generateTarget(optimization.optimizedIR);
  const machineOptimization = optimizeTarget(target.targetInstructions);
  return { basicBlocks, cfg, optimization, target, machineOptimization };
}

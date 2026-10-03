import type { IrInstruction } from "../ir/irTypes";
import { buildBasicBlocks, labelIndex, type BasicBlock } from "./basicBlocks";

export type CFGEdgeType = "FALLTHROUGH" | "TRUE_BRANCH" | "FALSE_BRANCH" | "UNCONDITIONAL" | "BACK_EDGE" | "RETURN";

export interface CFGEdge {
  id: string;
  from: string;
  to: string;
  type: CFGEdgeType;
  label: string;
}

export interface ControlFlowGraph {
  nodes: BasicBlock[];
  edges: CFGEdge[];
  entryBlockId: string | null;
  exitBlockIds: string[];
}

export function buildControlFlowGraph(instructions: IrInstruction[]): ControlFlowGraph {
  const nodes = buildBasicBlocks(instructions);
  const labels = labelIndex(instructions);
  const blockByInstruction = new Map<number, BasicBlock>();
  nodes.forEach((block) => {
    for (let index = block.startInstructionIndex; index <= block.endInstructionIndex; index++) blockByInstruction.set(index, block);
  });

  const edges: CFGEdge[] = [];
  const add = (from: BasicBlock, to: BasicBlock | undefined, type: CFGEdgeType, label: string) => {
    if (!to) return;
    const edgeType: CFGEdgeType = to.startInstructionIndex <= from.startInstructionIndex && type !== "FALSE_BRANCH" ? "BACK_EDGE" : type;
    edges.push({ id: `E${edges.length + 1}`, from: from.id, to: to.id, type: edgeType, label: edgeType === "BACK_EDGE" ? "BACK" : label });
  };

  nodes.forEach((block, index) => {
    const last = block.instructions.at(-1);
    const next = nodes[index + 1];
    if (!last) return;
    if (last.kind === "GOTO" && last.label) {
      add(block, blockByInstruction.get(labels.get(last.label) ?? -1), "UNCONDITIONAL", "GOTO");
    } else if (last.kind === "IF_FALSE_GOTO" && last.label) {
      add(block, next, "TRUE_BRANCH", "TRUE");
      add(block, blockByInstruction.get(labels.get(last.label) ?? -1), "FALSE_BRANCH", "FALSE");
    } else if (last.kind === "RETURN" || last.kind === "FUNCTION_END") {
      // exit block
    } else {
      add(block, next, "FALLTHROUGH", "NEXT");
    }
  });

  for (const edge of edges) {
    nodes.find((node) => node.id === edge.from)?.successors.push(edge.to);
    nodes.find((node) => node.id === edge.to)?.predecessors.push(edge.from);
  }

  return {
    nodes,
    edges,
    entryBlockId: nodes[0]?.id ?? null,
    exitBlockIds: nodes.filter((node) => node.successors.length === 0).map((node) => node.id)
  };
}

export function reachableBlocks(cfg: ControlFlowGraph): Set<string> {
  const seen = new Set<string>();
  const stack = cfg.entryBlockId ? [cfg.entryBlockId] : [];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of cfg.edges.filter((item) => item.from === id)) stack.push(edge.to);
  }
  return seen;
}

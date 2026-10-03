import { targetText } from "./registerManager";
import type { MachineOptimizationEvent, MachineOptimizationResult, TargetInstruction } from "./targetTypes";

export function optimizeTarget(instructions: TargetInstruction[]): MachineOptimizationResult {
  let current = instructions.map(clone);
  const events: MachineOptimizationEvent[] = [];
  let eventIndex = 0;
  emit("MACHINE_OPT_STARTED", "Machine-dependent optimization started.");

  let changed = true;
  while (changed) {
    changed = false;
    const next: TargetInstruction[] = [];
    for (let index = 0; index < current.length; index++) {
      const instruction = current[index];
      const following = current[index + 1];
      emit("PEEPHOLE_WINDOW_INSPECTED", `Inspect ${instruction.text}.`);
      if (instruction.opcode === "MOV" && instruction.operands[0]?.value === instruction.operands[1]?.value) {
        emit("REDUNDANT_MOVE_REMOVED", "Removed MOV from a register to itself.", instruction.text);
        changed = true;
        continue;
      }
      if ((instruction.opcode === "ADD" && instruction.operands[1]?.value === "0") || (instruction.opcode === "MUL" && instruction.operands[1]?.value === "1")) {
        emit("TARGET_INSTRUCTION_REMOVED", "Removed arithmetic no-op.", instruction.text);
        changed = true;
        continue;
      }
      if (instruction.opcode === "JMP" && following?.opcode === "LABEL" && instruction.operands[0]?.value === following.operands[0]?.value) {
        emit("JUMP_SIMPLIFIED", "Removed jump to immediately following label.", instruction.text);
        changed = true;
        continue;
      }
      if (instruction.opcode === "MOV" && following?.opcode === "MOV" && instruction.text === following.text) {
        emit("REDUNDANT_MOVE_REMOVED", "Removed duplicate MOV.", following.text);
        next.push(instruction);
        index += 1;
        changed = true;
        continue;
      }
      if (instruction.opcode === "LOAD" && following?.opcode === "LOAD" && instruction.text === following.text) {
        emit("REDUNDANT_LOAD_REMOVED", "Removed duplicate LOAD.", following.text);
        next.push(instruction);
        index += 1;
        changed = true;
        continue;
      }
      next.push(instruction);
    }
    current = next;
  }

  emit("MACHINE_OPT_COMPLETED", "Machine-dependent optimization completed.");
  return { originalTarget: instructions, finalTarget: current, events };

  function emit(type: MachineOptimizationEvent["type"], reason: string, before?: string, after?: string) {
    events.push({ id: `machine-opt-event-${eventIndex++}`, type, reason, before, after, targetAfter: current.map(clone) });
  }
}

function clone(instruction: TargetInstruction): TargetInstruction {
  return { ...instruction, operands: instruction.operands.map((operand) => ({ ...operand })) };
}

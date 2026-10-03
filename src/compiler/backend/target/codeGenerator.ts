import type { IrInstruction } from "../../ir/irTypes";
import { isConstant } from "../dataFlow";
import { RegisterManager, targetText } from "./registerManager";
import type { CodegenEvent, TargetInstruction, TargetOperand, TargetProgram } from "./targetTypes";

export function generateTarget(instructions: IrInstruction[]): TargetProgram {
  const registers = new RegisterManager();
  const target: TargetInstruction[] = [];
  const events: CodegenEvent[] = [];
  const memorySlots: Record<string, string> = {};
  let instructionIndex = 0;
  let eventIndex = 0;
  let memIndex = 0;

  emitEvent("CODEGEN_STARTED", "Code generation started.");
  for (const instruction of instructions) generate(instruction);
  emitEvent("CODEGEN_COMPLETED", "Code generation completed.");
  return { targetInstructions: target, events, memorySlots };

  function generate(instruction: IrInstruction) {
    switch (instruction.kind) {
      case "ASSIGN": {
        if (!instruction.result || !instruction.arg1) return;
        const source = ensureRegister(instruction.arg1, instruction);
        emit("STORE", [mem(instruction.result), reg(source)], instruction);
        registers.bind(source, instruction.result);
        ensureMemory(instruction.result);
        return;
      }
      case "BINARY": {
        if (!instruction.result || !instruction.arg1 || !instruction.arg2) return;
        const left = ensureRegister(instruction.arg1, instruction);
        const rightOperand = operand(instruction.arg2);
        const opcode = opToTarget(instruction.op);
        emit(opcode, [reg(left), rightOperand], instruction);
        if (["<", "<=", ">", ">=", "==", "!="].includes(instruction.op ?? "")) emit(setOpcode(instruction.op), [reg(left)], instruction);
        registers.bind(left, instruction.result);
        emit("STORE", [mem(instruction.result), reg(left)], instruction);
        ensureMemory(instruction.result);
        return;
      }
      case "UNARY": {
        if (!instruction.result || !instruction.arg1) return;
        const value = ensureRegister(instruction.arg1, instruction);
        emit(instruction.op === "!" ? "NOT" : "SUB", instruction.op === "!" ? [reg(value)] : [reg(value), imm("0")], instruction);
        registers.bind(value, instruction.result);
        emit("STORE", [mem(instruction.result), reg(value)], instruction);
        return;
      }
      case "LABEL":
        if (instruction.label) emit("LABEL", [label(instruction.label)], instruction);
        return;
      case "GOTO":
        if (instruction.label) emit("JMP", [label(instruction.label)], instruction);
        return;
      case "IF_FALSE_GOTO": {
        if (!instruction.arg1 || !instruction.label) return;
        const value = ensureRegister(instruction.arg1, instruction);
        emit("CMP", [reg(value), imm("0")], instruction);
        emit("JE", [label(instruction.label)], instruction);
        return;
      }
      case "PARAM": {
        if (!instruction.arg1) return;
        emit("PUSH", [operand(instruction.arg1)], instruction);
        return;
      }
      case "CALL": {
        if (instruction.functionName === "show") {
          emit("PRINT", [], instruction);
        } else {
          emit("CALL", [label(instruction.functionName ?? "anonymous")], instruction);
          if (instruction.result) {
            registers.bind("R0", instruction.result);
            emit("STORE", [mem(instruction.result), reg("R0")], instruction);
          }
        }
        registers.clearVolatile();
        return;
      }
      case "RETURN": {
        if (instruction.arg1) {
          const value = ensureRegister(instruction.arg1, instruction);
          emit("MOV", [reg("R0"), reg(value)], instruction);
        }
        emit("RET", [], instruction);
        return;
      }
      case "FUNCTION_START":
        if (instruction.functionName) emit("LABEL", [label(instruction.functionName)], instruction);
        return;
      case "FUNCTION_END":
        return;
    }
  }

  function ensureRegister(value: string, instruction: IrInstruction) {
    const existing = registers.registerContaining(value);
    if (existing) return existing;
    const allocated = registers.allocate(value, (spilled, register, slot) => {
      emit("STORE", [mem(slot), reg(register)], instruction, [`spill:${spilled}`]);
      emitEvent("VALUE_SPILLED", `Spilled ${spilled} to ${slot}.`);
    });
    emitEvent("REGISTER_ALLOCATED", `Allocated ${allocated} for ${value}.`);
    if (isConstant(value)) emit("MOV", [reg(allocated), imm(value)], instruction);
    else emit("LOAD", [reg(allocated), mem(value)], instruction);
    registers.bind(allocated, value);
    return allocated;
  }

  function emit(opcode: TargetInstruction["opcode"], operands: TargetOperand[], ir: IrInstruction, sourceIrIds = [ir.id]) {
    const item: TargetInstruction = {
      id: `TGT_${String(instructionIndex++).padStart(3, "0")}`,
      opcode,
      operands,
      sourceIrIds,
      sourceRange: ir.sourceRange,
      text: targetText(opcode, operands)
    };
    target.push(item);
    emitEvent("TARGET_INSTRUCTION_EMITTED", item.text, item.id, sourceIrIds);
  }

  function emitEvent(type: CodegenEvent["type"], message: string, instructionId?: string, sourceIrIds?: string[]) {
    events.push({
      id: `codegen-event-${eventIndex++}`,
      type,
      message,
      instructionId,
      sourceIrIds,
      registerState: registers.snapshot(),
      targetSoFar: target.map((instruction) => ({ ...instruction, operands: [...instruction.operands] }))
    });
  }

  function ensureMemory(name: string) {
    if (!memorySlots[name]) memorySlots[name] = `MEM${memIndex++}`;
    return memorySlots[name];
  }

  function operand(value: string): TargetOperand {
    if (isConstant(value)) return imm(value);
    const existing = registers.registerContaining(value);
    return existing ? reg(existing) : mem(value);
  }

  function reg(value: string): TargetOperand {
    return { kind: "REGISTER", value };
  }
  function mem(value: string): TargetOperand {
    ensureMemory(value);
    return { kind: "MEMORY", value };
  }
  function imm(value: string): TargetOperand {
    return { kind: value.startsWith('"') ? "STRING" : "IMMEDIATE", value };
  }
  function label(value: string): TargetOperand {
    return { kind: "LABEL", value };
  }
}

function opToTarget(op?: string): TargetInstruction["opcode"] {
  if (op === "+") return "ADD";
  if (op === "-") return "SUB";
  if (op === "*") return "MUL";
  if (op === "/") return "DIV";
  if (op === "%") return "MOD";
  if (op === "&&") return "AND";
  if (op === "||") return "OR";
  return "CMP";
}

function setOpcode(op?: string): TargetInstruction["opcode"] {
  if (op === "<") return "SETLT";
  if (op === "<=") return "SETLE";
  if (op === ">") return "SETGT";
  if (op === ">=") return "SETGE";
  if (op === "==") return "SETEQ";
  return "SETNE";
}

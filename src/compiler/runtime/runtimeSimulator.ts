import type { TargetInstruction, TargetOperand } from "../backend/target/targetTypes";
import type { SemanticAnalysisResult } from "../semantic/semanticTypes";
import type { RuntimeEvent, RuntimeSession, RuntimeState, RuntimeValue } from "./runtimeTypes";

const MAX_STEPS = 1000;

export function simulateRuntime(instructions: TargetInstruction[], semantic?: SemanticAnalysisResult | null): RuntimeSession {
  const labels = buildLabelMap(instructions);
  const entryPc = findEntryPc(instructions);
  const states: RuntimeState[] = [];
  const events: RuntimeEvent[] = [];
  let eventIndex = 0;
  let state: RuntimeState = {
    pc: entryPc,
    registers: { R0: null, R1: null, R2: null, R3: null },
    memory: {},
    operandStack: [],
    callStack: [],
    output: [],
    halted: instructions.length === 0
  };
  let comparison = 0;

  pushEvent("RUNTIME_STARTED", `Runtime started at target instruction ${entryPc}.`);

  for (let steps = 0; !state.halted && steps < MAX_STEPS; steps++) {
    const instruction = instructions[state.pc];
    if (!instruction) {
      state = { ...state, halted: true };
      pushEvent("RUNTIME_HALTED", "Program counter reached the end of the target program.");
      break;
    }
    const currentPc = state.pc;
    state = { ...state, currentInstructionId: instruction.id, pc: state.pc + 1 };

    try {
      switch (instruction.opcode) {
        case "LABEL":
          break;
        case "MOV":
          write(instruction.operands[0], read(instruction.operands[1]));
          break;
        case "LOAD":
          write(instruction.operands[0], read(instruction.operands[1]));
          break;
        case "STORE":
          write(instruction.operands[0], read(instruction.operands[1]));
          break;
        case "ADD":
          binary(instruction.operands, (a, b) => toNumber(a) + toNumber(b));
          break;
        case "SUB":
          binary(instruction.operands, (a, b) => instruction.operands[1]?.kind === "IMMEDIATE" && instruction.operands[1].value === "0" ? -toNumber(a) : toNumber(a) - toNumber(b));
          break;
        case "MUL":
          binary(instruction.operands, (a, b) => toNumber(a) * toNumber(b));
          break;
        case "DIV":
          binary(instruction.operands, (a, b) => toNumber(a) / toNumber(b));
          break;
        case "MOD":
          binary(instruction.operands, (a, b) => toNumber(a) % toNumber(b));
          break;
        case "AND":
          binary(instruction.operands, (a, b) => truthy(a) && truthy(b));
          break;
        case "OR":
          binary(instruction.operands, (a, b) => truthy(a) || truthy(b));
          break;
        case "NOT":
          write(instruction.operands[0], !truthy(read(instruction.operands[0])));
          break;
        case "CMP":
          comparison = compare(read(instruction.operands[0]), read(instruction.operands[1]));
          break;
        case "SETLT":
          write(instruction.operands[0], comparison < 0 ? 1 : 0);
          break;
        case "SETLE":
          write(instruction.operands[0], comparison <= 0 ? 1 : 0);
          break;
        case "SETGT":
          write(instruction.operands[0], comparison > 0 ? 1 : 0);
          break;
        case "SETGE":
          write(instruction.operands[0], comparison >= 0 ? 1 : 0);
          break;
        case "SETEQ":
          write(instruction.operands[0], comparison === 0 ? 1 : 0);
          break;
        case "SETNE":
          write(instruction.operands[0], comparison !== 0 ? 1 : 0);
          break;
        case "JMP":
          jump(instruction.operands[0]);
          break;
        case "JE":
          if (comparison === 0) jump(instruction.operands[0]);
          break;
        case "PUSH":
          state = { ...state, operandStack: [...state.operandStack, read(instruction.operands[0])] };
          break;
        case "POP": {
          const stack = [...state.operandStack];
          const value = stack.pop() ?? null;
          write(instruction.operands[0], value);
          state = { ...state, operandStack: stack };
          break;
        }
        case "CALL":
          call(instruction.operands[0]);
          break;
        case "RET":
          ret();
          break;
        case "PRINT": {
          const stack = [...state.operandStack];
          const value = stack.length > 0 ? stack.pop() ?? null : state.registers.R0;
          state = { ...state, operandStack: stack, output: [...state.output, display(value)] };
          pushEvent("RUNTIME_OUTPUT_EMITTED", `Output emitted: ${display(value)}`, instruction.id, currentPc);
          break;
        }
      }
      pushEvent("RUNTIME_INSTRUCTION_EXECUTED", instruction.text, instruction.id, currentPc);
    } catch (error) {
      state = { ...state, halted: true, error: error instanceof Error ? error.message : String(error) };
      pushEvent("RUNTIME_ERROR", state.error ?? "Runtime error.", instruction.id, currentPc);
    }
  }

  if (!state.halted) {
    state = { ...state, halted: true, error: "Runtime stopped after the step limit." };
    pushEvent("RUNTIME_ERROR", state.error ?? "Runtime stopped after the step limit.");
  }
  if (!events.some((event) => event.type === "RUNTIME_HALTED" || event.type === "RUNTIME_ERROR")) {
    pushEvent("RUNTIME_HALTED", "Runtime halted successfully.");
  }
  return { instructions, states, events, finalState: cloneState(state), semantic };

  function pushEvent(type: RuntimeEvent["type"], message: string, instructionId?: string, pc = state.pc) {
    const snapshot = cloneState(state);
    states.push(snapshot);
    events.push({ id: `runtime-event-${eventIndex++}`, type, instructionId, pc, message, state: snapshot });
  }

  function read(operand?: TargetOperand): RuntimeValue {
    if (!operand) return null;
    if (operand.kind === "REGISTER") return state.registers[operand.value] ?? null;
    if (operand.kind === "MEMORY") return state.memory[operand.value] ?? 0;
    if (operand.kind === "IMMEDIATE") return Number(operand.value);
    if (operand.kind === "STRING") return operand.value.replace(/^"|"$/g, "");
    if (operand.kind === "LABEL") return operand.value;
    return null;
  }

  function write(operand: TargetOperand | undefined, value: RuntimeValue) {
    if (!operand) return;
    if (operand.kind === "REGISTER") state = { ...state, registers: { ...state.registers, [operand.value]: value } };
    if (operand.kind === "MEMORY") state = { ...state, memory: { ...state.memory, [operand.value]: value } };
  }

  function binary(operands: TargetOperand[], fn: (left: RuntimeValue, right: RuntimeValue) => RuntimeValue) {
    const left = read(operands[0]);
    const right = read(operands[1]);
    write(operands[0], fn(left, right));
  }

  function jump(operand?: TargetOperand) {
    if (!operand || operand.kind !== "LABEL" || labels[operand.value] === undefined) throw new Error(`Unknown label ${operand?.value ?? ""}`.trim());
    state = { ...state, pc: labels[operand.value] };
  }

  function call(operand?: TargetOperand) {
    if (!operand || operand.kind !== "LABEL") throw new Error("CALL requires a label operand.");
    const target = labels[operand.value];
    if (target === undefined) throw new Error(`Unknown function ${operand.value}.`);
    const functionSymbol = semantic?.symbols.find((symbol) => symbol.kind === "FUNCTION" && symbol.name === operand.value);
    const params = functionSymbol?.kind === "FUNCTION" ? functionSymbol.parameters : [];
    const stack = [...state.operandStack];
    const nextMemory = { ...state.memory };
    for (let index = params.length - 1; index >= 0; index--) nextMemory[params[index].name] = stack.pop() ?? null;
    state = {
      ...state,
      pc: target,
      memory: nextMemory,
      operandStack: stack,
      callStack: [...state.callStack, { functionName: operand.value, returnPc: state.pc }]
    };
  }

  function ret() {
    const stack = [...state.callStack];
    const frame = stack.pop();
    if (!frame) {
      state = { ...state, halted: true };
      return;
    }
    state = { ...state, pc: frame.returnPc, callStack: stack };
  }
}

function buildLabelMap(instructions: TargetInstruction[]) {
  const labels: Record<string, number> = {};
  instructions.forEach((instruction, index) => {
    const label = instruction.opcode === "LABEL" ? instruction.operands[0] : undefined;
    if (label?.kind === "LABEL") labels[label.value] = index + 1;
  });
  return labels;
}

function findEntryPc(instructions: TargetInstruction[]) {
  let pc = 0;
  while (instructions[pc]?.opcode === "LABEL") {
    const ret = instructions.findIndex((instruction, index) => index > pc && instruction.opcode === "RET");
    if (ret < 0) break;
    pc = ret + 1;
  }
  return Math.min(pc, instructions.length);
}

function cloneState(state: RuntimeState): RuntimeState {
  return {
    ...state,
    registers: { ...state.registers },
    memory: { ...state.memory },
    operandStack: [...state.operandStack],
    callStack: state.callStack.map((frame) => ({ ...frame })),
    output: [...state.output]
  };
}

function toNumber(value: RuntimeValue) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function truthy(value: RuntimeValue) {
  return value === true || value === 1 || value === "true";
}

function compare(left: RuntimeValue, right: RuntimeValue) {
  const a = typeof left === "number" && typeof right === "number" ? left : display(left);
  const b = typeof left === "number" && typeof right === "number" ? right : display(right);
  if (a === b) return 0;
  return a > b ? 1 : -1;
}

function display(value: RuntimeValue) {
  if (value === null || value === undefined) return "";
  return String(value);
}

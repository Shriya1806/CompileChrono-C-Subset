import type { RegisterState, TargetInstruction } from "./targetTypes";

export class RegisterManager {
  private readonly registers = ["R0", "R1", "R2", "R3"];
  private contents = new Map<string, string>();
  private spills = new Map<string, string>();
  private spillIndex = 0;

  snapshot(): RegisterState {
    return {
      registers: Object.fromEntries(this.registers.map((register) => [register, this.contents.get(register) ?? null])),
      spills: Object.fromEntries(this.spills.entries())
    };
  }

  registerContaining(value: string): string | undefined {
    return [...this.contents.entries()].find(([, stored]) => stored === value)?.[0];
  }

  allocate(value: string, emitSpill?: (value: string, register: string, slot: string) => void): string {
    const existing = this.registerContaining(value);
    if (existing) return existing;
    const free = this.registers.find((register) => !this.contents.has(register));
    if (free) {
      this.contents.set(free, value);
      return free;
    }
    const register = this.registers[1] ?? this.registers[0];
    const spilled = this.contents.get(register)!;
    const slot = `SPILL_${++this.spillIndex}`;
    this.spills.set(spilled, slot);
    emitSpill?.(spilled, register, slot);
    this.contents.set(register, value);
    return register;
  }

  bind(register: string, value: string) {
    for (const [candidate, stored] of [...this.contents]) if (stored === value && candidate !== register) this.contents.delete(candidate);
    this.contents.set(register, value);
  }

  freeValue(value: string) {
    for (const [register, stored] of [...this.contents]) if (stored === value) this.contents.delete(register);
  }

  clearVolatile() {
    this.contents.clear();
  }
}

export function targetText(opcode: TargetInstruction["opcode"], operands: TargetInstruction["operands"]) {
  return `${opcode}${operands.length ? " " : ""}${operands.map((operand) => {
    if (operand.kind === "IMMEDIATE") return `#${operand.value}`;
    if (operand.kind === "STRING") return operand.value;
    return operand.value;
  }).join(", ")}`;
}

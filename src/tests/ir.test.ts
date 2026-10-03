import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";

describe("IR generation", () => {
  it("generates TAC preserving arithmetic precedence", () => {
    const result = compileSource(`num a = 10;
num b = 20;
num result = a + b * 2;
show(result);`);
    expect(result.allErrors).toHaveLength(0);
    expect(result.ir?.instructions.map((instruction) => instruction.text)).toEqual([
      "a = 10",
      "b = 20",
      "t1 = b * 2",
      "t2 = a + t1",
      "result = t2",
      "param result",
      "call show, 1"
    ]);
  });

  it("generates labels and jumps for if and while", () => {
    const result = compileSource(`num count = 0;
while count < 5 {
    show(count);
    count = count + 1;
}`);
    expect(result.allErrors).toHaveLength(0);
    const text = result.ir?.instructions.map((instruction) => instruction.text).join("\n") ?? "";
    expect(text).toContain("L1:");
    expect(text).toContain("ifFalse");
    expect(text).toContain("goto L1");
  });

  it("generates function boundaries, params, calls, and returns", () => {
    const result = compileSource(`func num add(num a, num b) {
    return a + b;
}
num result = add(10, 20);`);
    expect(result.allErrors).toHaveLength(0);
    const instructions = result.ir?.instructions.map((instruction) => instruction.text) ?? [];
    expect(instructions).toEqual(expect.arrayContaining(["func add:", "t1 = a + b", "return t1", "endfunc", "param 10", "param 20"]));
    expect(instructions.some((instruction) => instruction.includes("call add, 2"))).toBe(true);
  });

  it("emits equivalent quadruples and triples", () => {
    const result = compileSource("num a = 10; num b = 20; num result = a + b * 2;");
    expect(result.allErrors).toHaveLength(0);
    const multiplyQuad = result.ir?.quadruples.find((quad) => quad.operator === "*");
    const multiplyTriple = result.ir?.triples.find((triple) => triple.operator === "*");
    expect(multiplyQuad).toMatchObject({ arg1: "b", arg2: "2", result: "t1" });
    expect(multiplyTriple).toMatchObject({ arg1: "b", arg2: "2" });
    expect(result.ir?.diagnostics).toHaveLength(0);
  });
});

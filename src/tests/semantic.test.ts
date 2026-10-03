import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";

describe("semantic analysis", () => {
  it("builds symbols for globals, functions, parameters, and block scopes", () => {
    const result = compileSource(`func num add(num a, num b) {
    num local = a + b;
    return local;
}

num result = add(10, 20);`);
    expect(result.allErrors).toHaveLength(0);
    const symbols = result.semantic?.symbols ?? [];
    expect(symbols.map((symbol) => `${symbol.kind}:${symbol.name}:${symbol.type}`)).toEqual(expect.arrayContaining([
      "FUNCTION:add:NUM",
      "PARAMETER:a:NUM",
      "PARAMETER:b:NUM",
      "VARIABLE:local:NUM",
      "VARIABLE:result:NUM"
    ]));
    expect(result.semantic?.scopes.some((scope) => scope.kind === "FUNCTION" && scope.name === "FUNCTION:add")).toBe(true);
  });

  it("resolves identifiers and records references", () => {
    const result = compileSource("num a = 10; num b = a + 2; show(b);");
    expect(result.allErrors).toHaveLength(0);
    const symbolA = result.semantic?.symbols.find((symbol) => symbol.name === "a");
    const symbolB = result.semantic?.symbols.find((symbol) => symbol.name === "b");
    expect(symbolA?.references.length).toBeGreaterThan(0);
    expect(symbolB?.references.length).toBeGreaterThan(0);
  });

  it("reports duplicate declarations, undeclared identifiers, and assignment type mismatch", () => {
    expect(compileSource("num x = 10; num x = 20;").allErrors.some((error) => error.code === "DUPLICATE_SYMBOL")).toBe(true);
    expect(compileSource("num x = y + 10;").allErrors.some((error) => error.code === "UNDECLARED_IDENTIFIER")).toBe(true);
    const mismatch = compileSource('num a = 10; a = "hello";').allErrors.find((error) => error.code === "TYPE_MISMATCH");
    expect(mismatch).toMatchObject({ phase: "SEMANTIC", expected: "NUM", actual: "TEXT" });
  });

  it("checks conditions, calls, arguments, and returns", () => {
    expect(compileSource("num x = 10; if x { show(x); }").allErrors.some((error) => error.code === "INVALID_CONDITION_TYPE")).toBe(true);
    expect(compileSource("num result = unknown(10);").allErrors.some((error) => error.code === "UNKNOWN_FUNCTION")).toBe(true);
    expect(compileSource("func num add(num a, num b) { return a + b; } num x = add(10);").allErrors.some((error) => error.code === "ARGUMENT_COUNT_MISMATCH")).toBe(true);
    expect(compileSource('func num test() { return "hello"; }').allErrors.some((error) => error.code === "INVALID_RETURN_TYPE")).toBe(true);
  });
});

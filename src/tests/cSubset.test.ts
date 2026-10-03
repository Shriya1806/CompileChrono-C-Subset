import { describe, expect, it } from "vitest";
import { normalizeCSource } from "../compiler/language/cSubset";
import { compileSource } from "../compiler/compile";

describe("C subset frontend", () => {
  it("normalizes a small C main program into the existing compiler IR frontend", () => {
    const source = `#include <stdio.h>

int main() {
  int a = 10;
  int b = 20;
  int result = a + b * 2;
  printf("%d", result);
  return 0;
}`;

    const normalized = normalizeCSource(source);
    expect(normalized.source).toContain("num a = 10;");
    expect(normalized.source).toContain("show(result);");

    const result = compileSource(source, "c");
    expect(result.allErrors).toHaveLength(0);
    expect(result.ir?.instructions.some((instruction) => instruction.kind === "CALL" && instruction.functionName === "show")).toBe(true);
  });

  it("supports C-style function definitions and calls", () => {
    const source = `#include <stdio.h>

int add(int a, int b) {
  return a + b;
}

int main() {
  int result = add(10, 20);
  printf("%d", result);
  return 0;
}`;

    const result = compileSource(source, "c");
    expect(result.allErrors).toHaveLength(0);
    expect(result.ir?.instructions.some((instruction) => instruction.functionName === "add")).toBe(true);
  });
});

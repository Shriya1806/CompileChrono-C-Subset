import { describe, expect, it } from "vitest";
import { compileSource } from "../compiler/compile";
import { samplePrograms } from "../compiler/language/examples";
import type { AstNode } from "../compiler/syntax/ast/astTypes";

describe("predictive parser and AST", () => {
  it("accepts syntax-valid sample programs", () => {
    for (const sample of samplePrograms.filter((item) => item.name.startsWith("Syntax:"))) {
      const result = compileSource(sample.source);
      expect(result.allErrors, sample.name).toHaveLength(0);
      expect(result.syntax?.parseResult.accepted, sample.name).toBe(true);
      expect(result.syntax?.ast?.kind).toBe("Program");
    }
  });

  it("preserves arithmetic precedence in the AST", () => {
    const result = compileSource("num result = a + b * 2;");
    const declaration = result.syntax?.ast?.body[0];
    expect(declaration?.kind).toBe("VariableDeclaration");
    if (declaration?.kind !== "VariableDeclaration") throw new Error("Expected declaration");
    const init = declaration.initializer;
    expect(init?.kind).toBe("BinaryExpression");
    if (init?.kind !== "BinaryExpression") throw new Error("Expected binary expression");
    expect(init.operator).toBe("+");
    const right = init?.kind === "BinaryExpression" ? init.right : null;
    expect(right?.kind).toBe("BinaryExpression");
    expect(right && right.kind === "BinaryExpression" ? right.operator : null).toBe("*");
  });

  it("preserves logical precedence in the AST", () => {
    const result = compileSource("bool result = a || b && c;");
    const declaration = result.syntax?.ast?.body[0];
    if (declaration?.kind !== "VariableDeclaration") throw new Error("Expected declaration");
    const init = declaration.initializer;
    expect(init?.kind).toBe("BinaryExpression");
    expect(init && init.kind === "BinaryExpression" ? init.operator : null).toBe("||");
    const right = init && init.kind === "BinaryExpression" ? init.right : null;
    expect(right?.kind).toBe("BinaryExpression");
    expect(right && right.kind === "BinaryExpression" ? right.operator : null).toBe("&&");
  });

  it("parses if-else, while, functions, returns, calls, and nested blocks", () => {
    const source = `func num add(num a, num b) {
    return a + b;
}

num result = add(10, 20);
while result < 50 {
    if result != 30 {
        show(result);
    } else {
        show("thirty");
    }
    result = result + 1;
}`;
    const result = compileSource(source);
    expect(result.allErrors).toHaveLength(0);
    expect(kinds(result.syntax?.ast?.body ?? [])).toEqual(["FunctionDeclaration", "VariableDeclaration", "WhileStatement"]);
  });

  it("reports syntax errors with expected terminals and parser stack", () => {
    const result = compileSource("num result = a + ;");
    const syntaxError = result.allErrors.find((error) => error.phase === "SYNTAX");
    expect(syntaxError).toBeTruthy();
    expect(syntaxError?.found).toBe(";");
    expect(syntaxError?.expected).toContain("IDENTIFIER");
    expect(syntaxError?.parserState?.stackSnapshot?.length).toBeGreaterThan(0);
  });
});

function kinds(nodes: AstNode[]) {
  return nodes.map((node) => node.kind);
}

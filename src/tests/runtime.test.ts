import { describe, expect, it } from "vitest";
import { compileWithOrchestration } from "../compiler/orchestrator/compilerOrchestrator";

describe("phase 5 runtime simulator", () => {
  it("executes arithmetic target code and emits output 50", () => {
    const session = compileWithOrchestration(`num width = 10;
num height = 5;
num area = width * height;
show(area);`);

    expect(session.result.allErrors).toHaveLength(0);
    expect(session.runtime?.finalState.output).toEqual(["50"]);
    expect(session.snapshots.some((snapshot) => snapshot.phase === "RUNTIME")).toBe(true);
  });

  it("executes a simple function call and emits output 30", () => {
    const session = compileWithOrchestration(`func num add(num a, num b) {
    return a + b;
}

num result = add(10, 20);
show(result);`);

    expect(session.result.allErrors).toHaveLength(0);
    expect(session.runtime?.finalState.output).toEqual(["30"]);
  });

  it("does not run runtime when semantic analysis fails", () => {
    const session = compileWithOrchestration("num total = missing + 1;");

    expect(session.result.allErrors.length).toBeGreaterThan(0);
    expect(session.runtime).toBeNull();
    expect(session.phaseStatuses.find((phase) => phase.phase === "RUNTIME")?.status).toBe("SKIPPED");
  });
});

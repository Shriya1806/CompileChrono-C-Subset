import { describe, expect, it } from "vitest";
import { compileWithOrchestration } from "../compiler/orchestrator/compilerOrchestrator";

describe("phase 5 compiler orchestration", () => {
  it("creates one session with ordered events, statuses, and trace links", () => {
    const session = compileWithOrchestration("num a = 10; num b = 20; show(a + b);");

    expect(session.summary.accepted).toBe(true);
    expect(session.snapshots.map((snapshot) => snapshot.order)).toEqual(session.snapshots.map((_, index) => index));
    expect(session.phaseStatuses.every((phase) => phase.status === "SUCCESS" || phase.status === "SKIPPED")).toBe(true);
    expect(session.traceMap.entries.length).toBeGreaterThan(0);
    expect(session.traceMap.entries.some((entry) => entry.irInstructionIds.length > 0 && entry.targetInstructionIds.length > 0)).toBe(true);
  });

  it("marks downstream phases as skipped after an early error", () => {
    const session = compileWithOrchestration("num x = ;");

    expect(session.summary.accepted).toBe(false);
    expect(session.phaseStatuses.find((phase) => phase.phase === "SYNTAX")?.status).toBe("FAILED");
    expect(session.phaseStatuses.find((phase) => phase.phase === "SEMANTIC")?.status).toBe("SKIPPED");
  });
});

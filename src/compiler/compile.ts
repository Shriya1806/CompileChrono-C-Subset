import { lex } from "./lexer/lexer";
import { generateIr } from "./ir/irGenerator";
import type { IrGenerationResult } from "./ir/irTypes";
import { runBackend } from "./backend/backendPipeline";
import type { BackendResult } from "./backend/backendPipeline";
import { CompilerEventType, CompilerPhase } from "./snapshots/compilerEvent";
import type { CompilerSnapshot } from "./snapshots/compilerSnapshot";
import { SnapshotRecorder } from "./snapshots/snapshotRecorder";
import { analyzeSemantics } from "./semantic/semanticAnalyzer";
import type { SemanticAnalysisResult } from "./semantic/semanticTypes";
import { analyzeSyntax } from "./syntax/syntaxAnalyzer";
import { normalizeCSource, type LanguageMode } from "./language/cSubset";

export function compileSource(source: string, language: LanguageMode = "mini") {
  const normalized = language === "c" ? normalizeCSource(source) : { source, warnings: [] as string[] };
  const lexical = lex(normalized.source);
  if (lexical.errors.length > 0) {
    return {
      ...lexical,
      syntax: null,
      semantic: null,
      ir: null,
      backend: null,
      allErrors: lexical.errors,
      snapshots: lexical.snapshots,
      language,
      normalizedSource: normalized.source,
      warnings: normalized.warnings
    };
  }
  const syntax = analyzeSyntax(lexical.tokens);
  if (!syntax.ast || syntax.parseResult.errors.length > 0) {
    return {
      ...lexical,
      syntax,
      semantic: null,
      ir: null,
      backend: null,
      allErrors: [...lexical.errors, ...syntax.parseResult.errors],
      snapshots: [...lexical.snapshots, ...syntax.snapshots],
      language,
      normalizedSource: normalized.source,
      warnings: normalized.warnings
    };
  }
  const semantic = analyzeSemantics(syntax.ast);
  const ir = semantic.errors.length === 0 ? generateIr(semantic.ast) : null;
  const irSnapshots = ir ? snapshotsFromIr(ir) : [];
  const backend = ir ? runBackend(ir.instructions) : null;
  const backendSnapshots = backend ? snapshotsFromBackend(backend) : [];
  return {
    ...lexical,
    syntax,
    semantic,
    ir,
    backend,
    allErrors: [...lexical.errors, ...syntax.parseResult.errors, ...semantic.errors],
    snapshots: [...lexical.snapshots, ...syntax.snapshots, ...semantic.snapshots, ...irSnapshots, ...backendSnapshots],
    language,
    normalizedSource: normalized.source,
    warnings: normalized.warnings
  };
}

function snapshotsFromIr(ir: IrGenerationResult): CompilerSnapshot[] {
  const recorder = new SnapshotRecorder();
  for (const event of ir.events) {
    recorder.record({
      type: irEventType(event.type),
      phase: CompilerPhase.IR,
      title: event.type,
      description: event.message,
      sourceRange: event.sourceRange,
      metadata: event.payload,
      output: { instructionsSoFar: event.instructionsSoFar }
    });
  }
  return recorder.snapshots;
}

function irEventType(type: IrGenerationResult["events"][number]["type"]) {
  return CompilerEventType[type] ?? CompilerEventType.IR_INSTRUCTION_EMITTED;
}

export type CompileResult = ReturnType<typeof compileSource> & {
  semantic: SemanticAnalysisResult | null;
  ir: IrGenerationResult | null;
  backend: BackendResult | null;
};

function snapshotsFromBackend(backend: BackendResult): CompilerSnapshot[] {
  const recorder = new SnapshotRecorder();
  recorder.record({
    type: CompilerEventType.BASIC_BLOCKS_CONSTRUCTED,
    phase: CompilerPhase.MACHINE_INDEPENDENT_OPTIMIZATION,
    title: "Basic blocks constructed",
    description: `${backend.basicBlocks.length} basic block(s) constructed from TAC.`,
    output: backend.basicBlocks
  });
  recorder.record({
    type: CompilerEventType.CFG_CONSTRUCTED,
    phase: CompilerPhase.MACHINE_INDEPENDENT_OPTIMIZATION,
    title: "CFG constructed",
    description: `${backend.cfg.edges.length} CFG edge(s) created.`,
    output: backend.cfg
  });
  for (const event of backend.optimization.events) {
    recorder.record({
      type: CompilerEventType[event.type] ?? CompilerEventType.OPTIMIZATION_COMPLETED,
      phase: CompilerPhase.MACHINE_INDEPENDENT_OPTIMIZATION,
      title: event.type,
      description: event.reason,
      output: { instructionsAfter: event.instructionsAfter },
      metadata: { event }
    });
  }
  for (const event of backend.target.events) {
    recorder.record({
      type: CompilerEventType[event.type] ?? CompilerEventType.TARGET_INSTRUCTION_EMITTED,
      phase: CompilerPhase.CODE_GENERATION,
      title: event.type,
      description: event.message,
      output: { targetSoFar: event.targetSoFar, registerState: event.registerState },
      metadata: { event }
    });
  }
  for (const event of backend.machineOptimization.events) {
    recorder.record({
      type: CompilerEventType[event.type] ?? CompilerEventType.MACHINE_OPT_COMPLETED,
      phase: CompilerPhase.MACHINE_DEPENDENT_OPTIMIZATION,
      title: event.type,
      description: event.reason,
      output: { targetAfter: event.targetAfter },
      metadata: { event }
    });
  }
  recorder.record({
    type: CompilerEventType.TARGET_READY,
    phase: CompilerPhase.TARGET,
    title: "Final target code ready",
    description: `${backend.machineOptimization.finalTarget.length} final target instruction(s).`,
    output: backend.machineOptimization.finalTarget
  });
  return recorder.snapshots;
}

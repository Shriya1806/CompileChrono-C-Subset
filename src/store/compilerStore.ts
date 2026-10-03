import { create } from "zustand";
import { buildAutomataForRule } from "../compiler/automata/buildAutomataForRule";
import type { DFA, NFA, MinimizationResult, SubsetConstructionStep } from "../compiler/automata/models";
import { runDfaSimulation, type DfaSimulationStep } from "../compiler/automata/simulation/dfaSimulation";
import { runNfaSimulation, type NfaSimulationStep } from "../compiler/automata/simulation/nfaSimulation";
import { compileWithOrchestration } from "../compiler/orchestrator/compilerOrchestrator";
import type { CompilationSession } from "../compiler/orchestrator/sessionTypes";
import type { RuntimeSession } from "../compiler/runtime/runtimeTypes";
import { samplePrograms } from "../compiler/language/examples";
import { cSamplePrograms } from "../compiler/language/cExamples";
import type { LanguageMode } from "../compiler/language/cSubset";
import { getLexicalRule, getLexicalRuleForToken, lexicalRules, type LexicalRule } from "../compiler/language/lexicalRules";
import type { CompilerSnapshot } from "../compiler/snapshots/compilerSnapshot";
import type { CompilerError } from "../compiler/lexer/lexicalError";
import type { Token } from "../compiler/lexer/token";
import type { SyntaxAnalysisResult } from "../compiler/syntax/syntaxAnalyzer";
import type { AstNode, AstSourceRange } from "../compiler/syntax/ast/astTypes";
import type { SemanticAnalysisResult } from "../compiler/semantic/semanticTypes";
import type { SemanticSymbol } from "../compiler/semantic/symbols";
import type { IrGenerationResult, IrInstruction } from "../compiler/ir/irTypes";
import type { BackendResult } from "../compiler/backend/backendPipeline";

interface AutomataBundle {
  nfa: NFA;
  dfa: DFA;
  minimizedDfa: DFA;
  subsetSteps: SubsetConstructionStep[];
  minimization: MinimizationResult;
}

export type Workspace = "source" | "lexical" | "syntax" | "semantic" | "ir" | "cfg" | "optimization" | "codegen" | "target" | "runtime";

interface CompilerStore {
  language: LanguageMode;
  source: string;
  session: CompilationSession;
  tokens: Token[];
  errors: CompilerError[];
  syntax: SyntaxAnalysisResult | null;
  semantic: SemanticAnalysisResult | null;
  ir: IrGenerationResult | null;
  backend: BackendResult | null;
  runtime: RuntimeSession | null;
  snapshots: CompilerSnapshot[];
  workspace: Workspace;
  selectedTokenId: string | null;
  selectedErrorId: string | null;
  selectedAstNodeId: string | null;
  selectedSymbolId: string | null;
  selectedIrInstructionId: string | null;
  selectedTargetInstructionId: string | null;
  selectedSourceRange: AstSourceRange | null;
  selectedRuleId: string;
  parserStepIndex: number;
  simulationInput: string;
  simulationStep: number;
  automata: AutomataBundle;
  setSource: (source: string) => void;
  setLanguage: (language: LanguageMode) => void;
  compile: () => void;
  reset: () => void;
  loadExample: (index: number) => void;
  setWorkspace: (workspace: Workspace) => void;
  selectToken: (tokenId: string | null) => void;
  selectError: (errorId: string | null) => void;
  selectAstNode: (nodeId: string | null) => void;
  selectSymbol: (symbolId: string | null) => void;
  selectIrInstruction: (instructionId: string | null) => void;
  selectTargetInstruction: (instructionId: string | null) => void;
  selectRule: (ruleId: string) => void;
  jumpToPhase: (phase: string) => void;
  setSimulationInput: (value: string) => void;
  setSimulationStep: (step: number) => void;
  nextSimulationStep: () => void;
  resetSimulation: () => void;
  setParserStepIndex: (index: number) => void;
  nextParserStep: () => void;
  previousParserStep: () => void;
}

const initialRule = getLexicalRule("identifier");
const initialAutomata = buildAutomataForRule(initialRule);
const initialLanguage: LanguageMode = "mini";
const initialSource = samplePrograms[0].source;
const initialSession = compileWithOrchestration(initialSource, initialLanguage);
const initialResult = initialSession.result;

export const useCompilerStore = create<CompilerStore>((set, get) => ({
  language: initialLanguage,
  source: initialSource,
  session: initialSession,
  tokens: initialResult.tokens,
  errors: initialResult.allErrors,
  syntax: initialResult.syntax,
  semantic: initialResult.semantic,
  ir: initialResult.ir,
  backend: initialResult.backend,
  runtime: initialSession.runtime,
  snapshots: initialSession.snapshots,
  workspace: "source",
  selectedTokenId: null,
  selectedErrorId: null,
  selectedAstNodeId: null,
  selectedSymbolId: null,
  selectedIrInstructionId: null,
  selectedTargetInstructionId: null,
  selectedSourceRange: null,
  selectedRuleId: initialRule.id,
  parserStepIndex: 0,
  simulationInput: "value123",
  simulationStep: 0,
  automata: initialAutomata,
  setSource: (source) => set({ source }),
  setLanguage: (language) => {
    const examples = examplesForLanguage(language);
    const source = examples[0]?.source ?? "";
    const session = compileWithOrchestration(source, language);
    const result = session.result;
    const firstToken = result.tokens.find((token) => token.type !== "EOF");
    const activeRule = firstToken ? getLexicalRuleForToken(firstToken.type, firstToken.ruleId) : initialRule;
    set({
      language,
      source,
      session,
      tokens: result.tokens,
      errors: result.allErrors,
      syntax: result.syntax,
      semantic: result.semantic,
      ir: result.ir,
      backend: result.backend,
      runtime: session.runtime,
      snapshots: session.snapshots,
      parserStepIndex: 0,
      selectedErrorId: result.allErrors[0]?.id ?? null,
      selectedTokenId: firstToken?.id ?? null,
      selectedAstNodeId: null,
      selectedSymbolId: null,
      selectedIrInstructionId: null,
      selectedTargetInstructionId: null,
      selectedSourceRange: null,
      ...(activeRule ? buildRuleSelection(activeRule) : {})
    });
  },
  compile: () => {
    const session = compileWithOrchestration(get().source, get().language);
    const result = session.result;
    const firstToken = result.tokens.find((token) => token.type !== "EOF");
    const activeRule = firstToken ? getLexicalRuleForToken(firstToken.type, firstToken.ruleId) : initialRule;
    const ruleState = activeRule ? buildRuleSelection(activeRule) : {};

    set({
      session,
      tokens: result.tokens,
      errors: result.allErrors,
      syntax: result.syntax,
      semantic: result.semantic,
      ir: result.ir,
      backend: result.backend,
      runtime: session.runtime,
      snapshots: session.snapshots,
      parserStepIndex: 0,
      selectedErrorId: result.allErrors[0]?.id ?? null,
      selectedTokenId: firstToken?.id ?? null,
      selectedAstNodeId: null,
      selectedSymbolId: null,
      selectedIrInstructionId: null,
      selectedTargetInstructionId: null,
      selectedSourceRange: null,
      ...ruleState
    });
  },
  reset: () => {
    const session = compileWithOrchestration(get().language === "c" ? cSamplePrograms[0].source : initialSource, get().language);
    const result = session.result;
    const ruleState = buildRuleSelection(initialRule);
    set({
      source: get().language === "c" ? cSamplePrograms[0].source : initialSource,
      session,
      tokens: result.tokens,
      errors: result.allErrors,
      syntax: result.syntax,
      semantic: result.semantic,
      ir: result.ir,
      backend: result.backend,
      runtime: session.runtime,
      snapshots: session.snapshots,
      selectedTokenId: null,
      selectedErrorId: null,
      selectedAstNodeId: null,
      selectedSymbolId: null,
      selectedIrInstructionId: null,
      selectedTargetInstructionId: null,
      selectedSourceRange: null,
      parserStepIndex: 0,
      workspace: "source",
      ...ruleState
    });
  },
  loadExample: (index) => {
    const examples = examplesForLanguage(get().language);
    const source = examples[index]?.source ?? examples[0]?.source ?? "";
    const session = compileWithOrchestration(source, get().language);
    const result = session.result;
    const firstToken = result.tokens.find((token) => token.type !== "EOF");
    const sampleRuleMap = ["identifier", "integer", "string", "keyword", "eq"];
    const sampleRuleId = sampleRuleMap[index % sampleRuleMap.length];
    const sampleRule = lexicalRules.find((r) => r.id === sampleRuleId) ?? (firstToken ? getLexicalRuleForToken(firstToken.type, firstToken.ruleId) : initialRule);
    const ruleState = sampleRule ? buildRuleSelection(sampleRule) : {};
    set({
      source,
      session,
      tokens: result.tokens,
      errors: result.allErrors,
      syntax: result.syntax,
      semantic: result.semantic,
      ir: result.ir,
      backend: result.backend,
      runtime: session.runtime,
      snapshots: session.snapshots,
      selectedTokenId: firstToken?.id ?? null,
      selectedErrorId: null,
      selectedAstNodeId: null,
      selectedSymbolId: null,
      selectedIrInstructionId: null,
      selectedTargetInstructionId: null,
      selectedSourceRange: null,
      parserStepIndex: 0,
      workspace: "source",
      ...ruleState
    });
  },
  setWorkspace: (workspace) => set({ workspace }),
  selectToken: (tokenId) => {
    const token = get().tokens.find((item) => item.id === tokenId);
    const rule = token ? getLexicalRuleForToken(token.type, token.ruleId) : undefined;
    set({
      selectedTokenId: tokenId,
      selectedErrorId: null,
      selectedAstNodeId: null,
      selectedSymbolId: null,
      selectedIrInstructionId: null,
      selectedTargetInstructionId: null,
      selectedSourceRange: token ? {
        startOffset: token.startOffset,
        endOffset: token.endOffset,
        line: token.line,
        column: token.column,
        length: Math.max(1, token.endOffset - token.startOffset)
      } : null,
      ...(rule ? buildRuleSelection(rule) : {})
    });
  },
  selectError: (errorId) => {
    const error = get().errors.find((item) => item.id === errorId);
    set({
      selectedErrorId: errorId,
      selectedTokenId: null,
      selectedAstNodeId: null,
      selectedSourceRange: error?.sourceRange ?? null,
      parserStepIndex: error?.parserState?.tokenIndex ?? get().parserStepIndex
    });
  },
  selectAstNode: (nodeId) => {
    const ast = get().syntax?.ast;
    const node = nodeId && ast ? findAstNode(ast, nodeId) : null;
    set({ selectedAstNodeId: nodeId, selectedSourceRange: node?.sourceRange ?? null, selectedTokenId: null, selectedErrorId: null, selectedSymbolId: null, selectedIrInstructionId: null });
  },
  selectSymbol: (symbolId) => {
    const symbol = symbolId ? get().semantic?.symbols.find((item) => item.id === symbolId) : null;
    set({ selectedSymbolId: symbolId, selectedSourceRange: symbol?.declarationRange ?? null, selectedTokenId: null, selectedErrorId: null, selectedAstNodeId: null, selectedIrInstructionId: null, selectedTargetInstructionId: null });
  },
  selectIrInstruction: (instructionId) => {
    const instruction = instructionId ? get().ir?.instructions.find((item) => item.id === instructionId) : null;
    set({ selectedIrInstructionId: instructionId, selectedSourceRange: instruction?.sourceRange ?? null, selectedTokenId: null, selectedErrorId: null, selectedAstNodeId: null, selectedSymbolId: null, selectedTargetInstructionId: null });
  },
  selectTargetInstruction: (instructionId) => {
    const instruction = instructionId ? get().backend?.machineOptimization.finalTarget.find((item) => item.id === instructionId) : null;
    set({ selectedTargetInstructionId: instructionId, selectedSourceRange: instruction?.sourceRange ?? null, selectedTokenId: null, selectedErrorId: null, selectedAstNodeId: null, selectedSymbolId: null, selectedIrInstructionId: instruction?.sourceIrIds[0] ?? null });
  },
  selectRule: (ruleId) => {
    const rule = lexicalRules.find((item) => item.id === ruleId) ?? initialRule;
    set(buildRuleSelection(rule));
  },
  jumpToPhase: (phase) => {
    const map: Record<string, Workspace> = {
      SOURCE: "source",
      LEXICAL: "lexical",
      SYNTAX: "syntax",
      SEMANTIC: "semantic",
      IR: "ir",
      MACHINE_INDEPENDENT_OPTIMIZATION: "optimization",
      CODE_GENERATION: "codegen",
      MACHINE_DEPENDENT_OPTIMIZATION: "target",
      TARGET: "target",
      RUNTIME: "runtime"
    };
    set({ workspace: map[phase] ?? get().workspace });
  },
  setSimulationInput: (value) => set({ simulationInput: value, simulationStep: 0 }),
  setSimulationStep: (step) => set({ simulationStep: clamp(step, 0, simulationLength(get())) }),
  nextSimulationStep: () => get().setSimulationStep(get().simulationStep + 1),
  resetSimulation: () => set({ simulationStep: 0 })
  ,
  setParserStepIndex: (index) => set({ parserStepIndex: clamp(index, 0, Math.max(0, (get().syntax?.parseResult.steps.length ?? 1) - 1)) }),
  nextParserStep: () => get().setParserStepIndex(get().parserStepIndex + 1),
  previousParserStep: () => get().setParserStepIndex(get().parserStepIndex - 1)
}));

function examplesForLanguage(language: LanguageMode) {
  return language === "c" ? cSamplePrograms : samplePrograms;
}

export function selectCurrentRule(state: CompilerStore): LexicalRule {
  return lexicalRules.find((rule) => rule.id === state.selectedRuleId) ?? initialRule;
}

export function selectDfaSimulation(state: CompilerStore): DfaSimulationStep[] {
  return runDfaSimulation(state.automata.minimizedDfa, state.simulationInput);
}

export function selectNfaSimulation(state: CompilerStore): NfaSimulationStep[] {
  return runNfaSimulation(state.automata.nfa, state.simulationInput);
}

function buildRuleSelection(rule: LexicalRule) {
  return {
    selectedRuleId: rule.id,
    automata: buildAutomataForRule(rule),
    simulationInput: rule.examples[0] ?? "",
    simulationStep: 0
  };
}

function simulationLength(state: CompilerStore): number {
  return Math.max(0, runDfaSimulation(state.automata.minimizedDfa, state.simulationInput).length - 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findAstNode(node: AstNode, id: string): AstNode | null {
  if (node.id === id) return node;
  for (const child of astChildren(node)) {
    const found = findAstNode(child, id);
    if (found) return found;
  }
  return null;
}

export function astChildren(node: AstNode): AstNode[] {
  switch (node.kind) {
    case "Program":
      return node.body;
    case "VariableDeclaration":
      return node.initializer ? [node.initializer] : [];
    case "Assignment":
      return [node.target, node.value];
    case "BinaryExpression":
      return [node.left, node.right];
    case "UnaryExpression":
      return [node.argument];
    case "IfStatement":
      return [node.condition, node.thenBranch, ...(node.elseBranch ? [node.elseBranch] : [])];
    case "WhileStatement":
      return [node.condition, node.body];
    case "Block":
      return node.body;
    case "ShowStatement":
      return [node.expression];
    case "FunctionDeclaration":
      return [...node.params, node.body];
    case "FunctionCall":
      return [node.callee, ...node.args];
    case "ReturnStatement":
      return node.value ? [node.value] : [];
    default:
      return [];
  }
}

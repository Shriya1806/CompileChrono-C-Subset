# Compiler Architecture

CompileChrono is organized as a pipeline with a UI laboratory for each phase.

## Pipeline

1. Lexer emits tokens and lexical snapshots.
2. Syntax analyzer computes grammar data, runs the predictive parser, and builds parse tree plus AST.
3. Semantic analyzer builds scopes and symbols, resolves identifiers/functions, and performs type checks.
4. IR generator emits three-address code plus quadruples and triples.
5. Backend builds basic blocks and CFG, runs optimization passes, generates target code, and performs peephole optimization.
6. Runtime simulator executes the final target instructions.

## Phase 5 Integration

`compiler/orchestrator/compilerOrchestrator.ts` wraps the existing compiler and creates a `CompilationSession`. A session owns:

- Ordered snapshots across every phase.
- Phase status cards.
- Runtime session.
- Trace map across source, tokens, AST, symbols, IR, and target code.
- Phase status and trace data for direct navigation.

The existing `compileSource` API remains available for lower-level tests and phase modules. The UI store now uses the orchestrator so all panels share one coherent session.

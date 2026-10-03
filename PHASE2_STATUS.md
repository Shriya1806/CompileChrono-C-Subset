# Phase 2 Status

## Completed Features

- Centralized LL(1)-oriented grammar for the mini language.
- Grammar validation diagnostics.
- Nullable calculation.
- FIRST set calculation and FIRST-of-sequence support.
- FOLLOW set calculation.
- LL(1) parsing-table generation with conflict reporting.
- Table-driven predictive parser.
- Parser event and parser step model.
- Parsing stack, input pointer, selected production, and selected parsing-table cell snapshots.
- Parse-tree construction during parsing.
- AST construction after successful parsing with explicit semantic node types.
- Syntax error model with expected terminals, found token, parser stack snapshot, source range, and current non-terminal.
- Panic-mode recovery using FOLLOW sets.
- Syntax Analysis Lab UI with Grammar, FIRST/FOLLOW, Parsing Table, Parsing Stack, Parse Tree, AST, and Parser Timeline tabs.
- Source-to-AST highlighting.
- Syntax snapshots integrated into the existing CompileChrono timeline.
- Syntax-valid and syntax-invalid sample programs.

## Grammar Summary

The grammar supports declarations, assignments, arithmetic/logical/comparison expressions, `show`, `if`, `if-else`, `while`, blocks, function declarations, parameters, function calls, and returns. Expression precedence is encoded through layered non-terminals, and identifier-led forms are left-factored for predictive parsing.

## Parser Algorithm

The parser initializes the stack with `EOF` and `Program`. On terminal stack tops, it matches or reports a syntax error. On non-terminal stack tops, it consults the LL(1) table using the current lookahead, applies the selected production, creates parse-tree children, and pushes RHS symbols in reverse order while skipping epsilon.

## Tests

- Phase 1 lexer, automata, and snapshot tests remain active.
- Phase 2 grammar tests cover validation, nullable, FIRST, FOLLOW, FIRST-of-sequence, and parsing table generation.
- Parser tests cover valid programs, precedence, logical precedence, nested control flow, functions, calls, returns, and syntax errors.
- Syntax snapshot tests verify serializable syntax-phase snapshots and parser-step metadata.

## Build Status

`npm run test` passes: 6 files, 23 tests.

`npm run build` passes. Vite reports a chunk-size warning because Monaco and React Flow are large dependencies.

## Known Limitations

- Phase 2 performs syntax analysis only. No semantic type checking, scope validation, undeclared-variable detection, function signature checking, IR, optimization, or code generation is implemented.
- Parse-tree layout is deterministic and simple; it is built for clarity rather than optimal graph compaction.
- Parser playback has deterministic step controls; continuous parser-specific autoplay is represented by jump-to-end while the global Time Machine still supports play/pause.

## Phase 3 Hooks

- AST nodes preserve source ranges and semantic node kinds for future semantic analysis.
- Syntax snapshots contain stack, lookahead, table cell, production, and parse-tree state for deterministic Time Machine reconstruction.
- Compiler phases beyond syntax remain present but inactive.

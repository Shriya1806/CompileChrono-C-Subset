# Phase 1 Status

## Completed Features

- Vite React TypeScript project with Tailwind styling.
- Central mini-language lexical specification.
- Independent compiler core for lexical analysis and automata algorithms.
- Regex AST for literals, character classes, concatenation, alternation, star, plus, and optional.
- Thompson regex-to-NFA construction.
- NFA simulation and acceptance checks.
- Subset construction from NFA to DFA with stored NFA-state subsets.
- DFA minimization by partition refinement with recorded steps.
- Real lexer with maximal munch, priority tie-breaking, EOF token, skipped whitespace/comments, source locations, and lexical errors.
- Serializable compiler events and snapshots for the initial CompileChrono timeline.
- Monaco editor with custom language highlighting and source decorations.
- Token table with token/source/rule traceability.
- Lexical-rule browser, NFA/DFA/minimized-DFA visualizers, simulation controls, error panel, and timeline controls.

## Test Status

Core lexer, automata, and snapshot tests are included under `src/tests`.

## Known Limitations

- Phase 1 intentionally does not parse syntax or validate statement grammar.
- String escapes are not part of the Phase 1 language.
- Automata alphabet generation targets printable ASCII for educational clarity.
- React Flow graph layout is deterministic and simple rather than a full graph-layout engine.

## Future Hooks for Phase 2

- Snapshot phases already include syntax, semantic, IR, optimization, code generation, and target stages.
- Token source ranges are designed to extend to AST, IR, and generated-code traceability.
- Compiler outputs remain serializable so the Time Machine can replay future phases.

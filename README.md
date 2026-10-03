# CompileChrono

CompileChrono is an interactive visual compiler for a small teaching language. It shows source text through lexical analysis, LL(1) parsing, semantic analysis, IR generation, optimization, target code, and runtime execution.

## Features

- Monaco source editor with curated examples.
- Visual lexical laboratory with regex rules, NFA, DFA, minimization, and token traces.
- Syntax laboratory with grammar, FIRST/FOLLOW sets, LL(1) table, parser stack, parse tree, and AST.
- Semantic laboratory with scopes, symbol table, type checks, annotations, and diagnostics.
- IR laboratory with TAC, quadruples, triples, and AST-to-IR links.
- Backend laboratory with basic blocks, CFG, machine-independent optimization, code generation, register state, peephole optimization, and final target code.
- Minimal Neo-Brutalist phase workspace with direct navigation, trace map data, and runtime simulator.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Verify

```bash
npm run test
npm run build
```

Useful demos are in the example picker: `Phase 5: Arithmetic Output 50`, `Phase 5: Function Output 30`, `Phase 5: Optimization Demo`, `Phase 5: Nested Scope`, and `Phase 5: Error Path`.

# CompileChrono Phase 1

CompileChrono is an educational compiler IDE. Phase 1 implements the lexical-analysis foundation only: source editing, tokenization, lexical errors, regex-to-automata algorithms, automata simulation, and serializable phase events.

## Mini Language Lexical Specification

Types are `num`, `dec`, `text`, and `bool`. Control/output keywords are `if`, `else`, `while`, `func`, `return`, and `show`. Boolean literals are `true` and `false`.

Identifiers match `[A-Za-z_][A-Za-z0-9_]*`. Integers match `[0-9]+`. Decimals match `[0-9]+\.[0-9]+`. Strings match `"[^"\n]*"`. Single-line comments start with `//` and are skipped.

Operators include `+`, `-`, `*`, `/`, `%`, `=`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `||`, and `!`. Punctuation includes `(`, `)`, `{`, `}`, `,`, and `;`.

## Token Definitions

Token definitions live in `src/compiler/language/tokens.ts` and lexical rules live in `src/compiler/language/lexicalRules.ts`. Each rule has an id, name, token type, display pattern, internal regex AST, priority, description, examples, and anchored matcher. The lexer uses longest-match first, then priority.

## Lexer Architecture

The lexer is in `src/compiler/lexer/lexer.ts`. It skips whitespace and comments while preserving line, column, and offset information. It emits structured tokens with `type`, `lexeme`, `line`, `column`, `startOffset`, `endOffset`, and `ruleId`. Invalid characters and unterminated strings produce `CompilerError` objects.

## Thompson Construction

`src/compiler/automata/nfa/thompson.ts` implements Thompson construction for literals, character classes, concatenation, alternation, Kleene star, one-or-more, optional, and epsilon. The generated NFA has stable state ids and explicit transition symbols.

## Subset Construction

`src/compiler/automata/dfa/subsetConstruction.ts` implements epsilon closure, move integration, and subset construction. Each DFA state stores the NFA-state subset it represents, enabling visual traceability from DFA states back to NFA states.

## DFA Minimization

`src/compiler/automata/minimization/minimizeDfa.ts` uses partition refinement. It records partition steps, equivalent-state groups, state counts before and after, and a minimized DFA that preserves acceptance behavior.

## Snapshot Architecture

Snapshots and events are pure serializable data in `src/compiler/snapshots`. Phase 1 records source loading, character reads, rule matching, token recognition, token emission, whitespace/comment skipping, lexical errors, and lexer completion.

## Visualization Data Flow

React components never recreate compiler algorithms. The store builds automata from the selected lexical rule using compiler-core functions, then passes NFA/DFA data into React Flow visualizers. Monaco source highlights come from token/error source ranges.

## Running

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Build production assets:

```bash
npm run build
```

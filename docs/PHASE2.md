# CompileChrono Phase 2

Phase 2 extends CompileChrono with real syntax analysis. It keeps Phase 1 lexical analysis intact and adds grammar validation, nullable/FIRST/FOLLOW computation, LL(1) table generation, table-driven predictive parsing, parse-tree construction, AST construction, syntax errors, parser snapshots, and a Syntax Analysis Lab UI.

## Mini-language Grammar

The grammar is defined in `src/compiler/syntax/grammar/miniGrammar.ts`. It supports programs, statement lists, variable declarations, assignments, `show`, `if`, `if-else`, `while`, blocks, function declarations, parameters, return statements, function calls, argument lists, and expressions.

Expressions are layered to encode precedence:

`Expression -> LogicalOr -> LogicalAnd -> Equality -> Comparison -> Term -> Factor -> Unary -> Primary`

This preserves arithmetic and logical precedence, such as `a + b * 2` and `a || b && c`.

## Why It Is LL(1)

The grammar avoids left recursion by using prime productions such as `TermPrime`, `FactorPrime`, and `LogicalOrPrime`. Identifier-led ambiguity is left-factored:

`IdentifierStatement -> IDENTIFIER IdentifierStatementTail`

`Primary -> IDENTIFIER PrimaryIdentifierTail`

The parser uses one lookahead token to choose between assignment, function-call statement, identifier expression, and function-call expression.

## Algorithms

- `validateGrammar` checks undefined symbols, duplicate productions, unreachable non-terminals, empty RHS mistakes, and left recursion signals.
- `computeNullable` iterates to a fixed point over epsilon-capable productions.
- `computeFirstSets` derives FIRST sets from productions and supports `firstOfSequence`.
- `computeFollowSets` applies the standard `A -> alpha B beta` rules until fixed point.
- `buildLL1ParsingTable` fills table entries from FIRST/FOLLOW and records conflicts instead of overwriting them.
- `parseTokens` implements a table-driven predictive parser with stack, input pointer, production selection, parse-tree updates, syntax errors, and panic-mode recovery.

## Parse Tree and AST

The parser creates a concrete parse tree while applying productions. After successful parsing, `buildAst` constructs explicit AST nodes:

- Program
- VariableDeclaration
- Assignment
- BinaryExpression
- UnaryExpression
- Literal
- Identifier
- IfStatement
- WhileStatement
- Block
- ShowStatement
- FunctionDeclaration
- FunctionCall
- ReturnStatement
- Parameter

AST nodes preserve source ranges for source highlighting.

## Syntax Error Recovery

Syntax errors include phase, message, source range, expected terminals, found token, current non-terminal, stack snapshot, and token index. Panic-mode recovery skips tokens until a synchronization token from the current non-terminal's FOLLOW set.

## Phase Events

Syntax snapshots are pure serializable data. They include grammar loading, nullable/FIRST/FOLLOW computation, table readiness, parser steps, production applications, token matches, syntax errors, AST creation, and syntax completion. Parser steps preserve stack, token pointer, selected parsing-table cell, selected production, and parse-tree state.

## UI Flow

The Syntax Analysis Lab includes:

- Grammar
- FIRST / FOLLOW
- Parsing Table
- Parsing Stack
- Parse Tree
- AST
- Parser Stack

The parser stack, parsing-table cell, selected production, parse-tree node, source range, and AST source mapping all derive from compiler-core outputs.

## Running

```bash
npm install
npm run test
npm run build
npm run dev
```

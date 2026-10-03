# CompileChrono Phase 3

Phase 3 extends CompileChrono with semantic analysis and intermediate representation generation. It preserves the Phase 1 lexer and Phase 2 parser, then adds:

- type system
- lexical scopes
- symbol table
- identifier resolution
- type checking
- function and return validation
- annotated AST
- three-address code
- quadruples
- triples
- semantic and IR snapshots

## Type System

Types are centralized in `src/compiler/semantic/types.ts`.

Language mappings:

- `num` -> `NUM`
- `dec` -> `DEC`
- `text` -> `TEXT`
- `bool` -> `BOOL`
- untyped functions -> `VOID`

Assignment allows exact matches and numeric widening from `NUM` to `DEC`. `DEC` to `NUM` is rejected.

Arithmetic supports numeric operands. `TEXT + TEXT` is accepted as text concatenation. Comparisons over numeric values produce `BOOL`. Equality requires compatible types. Logical operators require `BOOL`.

## Scope Model

Scopes are represented by `Scope` records:

- `GLOBAL`
- `FUNCTION`
- `BLOCK`

Each scope has a stable id, parent id, kind, name, symbol ids, and source range. Lookup walks the current scope chain toward global scope.

## Symbol Table

Symbols are structured records:

- `VARIABLE`
- `FUNCTION`
- `PARAMETER`

The symbol table supports scope creation, scope exit, local lookup, parent-chain lookup, function lookup, declaration, duplicate detection, and reference tracking.

## Semantic Passes

The analyzer in `src/compiler/semantic/semanticAnalyzer.ts` performs:

1. function predeclaration
2. scope construction
3. declaration collection
4. identifier resolution
5. expression type checking
6. assignment and initializer validation
7. condition validation
8. function-call validation
9. return validation

Semantic events are serializable and include scope entry/exit, symbol declarations, symbol resolution, type inference, type-check success/failure, argument checks, return checks, semantic errors, and completion.

## Semantic Errors

Supported semantic errors include:

- `UNDECLARED_IDENTIFIER`
- `DUPLICATE_SYMBOL`
- `TYPE_MISMATCH`
- `INVALID_OPERATOR_TYPES`
- `INVALID_CONDITION_TYPE`
- `UNKNOWN_FUNCTION`
- `ARGUMENT_COUNT_MISMATCH`
- `ARGUMENT_TYPE_MISMATCH`
- `INVALID_RETURN_TYPE`
- `RETURN_OUTSIDE_FUNCTION`
- `DUPLICATE_FUNCTION`

Errors preserve phase, code, message, source range, expected/actual types, symbol name, scope id, and related declaration location where available.

## Annotated AST

Semantic annotations are stored separately from parser AST nodes. An annotation can include:

- resolved type
- resolved symbol id
- scope id
- constant value
- function signature
- semantic status

The UI displays these annotations in the Semantic Analysis Lab.

## IR Design

IR is generated only after successful semantic analysis. The primary IR is structured three-address code, not strings. Instruction kinds include:

- assignment
- binary
- unary
- label
- goto
- if-false-goto
- param
- call
- return
- function start/end

Temporaries are deterministic: `t1`, `t2`, `t3`. Labels are deterministic: `L1`, `L2`, `L3`.

## TAC, Quadruples, Triples

TAC is rendered from structured instructions. Quadruples use:

`operator | arg1 | arg2 | result`

Triples reference temporary-producing instructions with `(index)` references where possible.

## Phase Events

Semantic and IR snapshots are recorded under phases `SEMANTIC` and `IR`. Snapshots preserve symbol-table state, scope activity, semantic checks, TAC emitted so far, temporary creation, label creation, and instruction emission.

## Running

```bash
npm install
npm run test
npm run build
npm run dev
```

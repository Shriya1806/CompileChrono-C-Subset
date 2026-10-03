# CompileChrono Phase 4

Phase 4 adds the compiler backend: basic blocks, CFG, machine-independent optimization, target-code generation, register management, machine-dependent optimization, final target code, and backend snapshots.

## Basic Blocks

`identifyLeaders` marks an instruction as a leader when it is:

1. the first instruction
2. a jump target
3. immediately after a jump or return
4. a function start

`buildBasicBlocks` then creates deterministic blocks `B1`, `B2`, `B3`, etc. Each block stores instruction range, instructions, predecessors, successors, and source range.

## CFG Construction

`buildControlFlowGraph` creates nodes from basic blocks and edges from instruction control flow:

- `FALLTHROUGH`
- `TRUE_BRANCH`
- `FALSE_BRANCH`
- `UNCONDITIONAL`
- `BACK_EDGE`
- `RETURN`

Backward jump edges are marked as loop/back edges.

## Optimization Framework

Optimization passes implement a shared interface and return immutable optimized IR plus events. The pass order is:

1. Constant Folding
2. Constant Propagation
3. Copy Propagation
4. Algebraic Simplification
5. Local Common Subexpression Elimination
6. Dead Code Elimination
7. Unreachable Code Elimination

Each pass emits structured events with before/after text, instruction ids, pass id, reason, and IR state after the event.

## Optimizations

Constant folding evaluates safe literal arithmetic, comparisons, boolean operations, and text concatenation.

Constant propagation is conservative and local; it clears state across labels and jumps.

Copy propagation is local and invalidates copies on redefinition.

Algebraic simplification handles identities such as `x + 0`, `x * 1`, and `x * 0`.

Common subexpression elimination reuses matching expressions inside a local straight-line region.

Dead code elimination removes unused pure assignments and temporary computations while preserving side-effecting instructions.

Unreachable code elimination uses CFG reachability from the entry block.

## Target Machine

The educational target machine uses registers `R0` through `R3`, symbolic memory operands, immediates, strings, and labels.

Supported opcodes include:

- `MOV`, `LOAD`, `STORE`
- `ADD`, `SUB`, `MUL`, `DIV`, `MOD`
- `CMP`, `SETLT`, `SETLE`, `SETGT`, `SETGE`, `SETEQ`, `SETNE`
- `AND`, `OR`, `NOT`
- `JMP`, `JE`
- `CALL`, `RET`, `PUSH`, `PRINT`, `LABEL`

## Register Management

The register manager tracks register contents, allocates free registers, reuses registers already holding a value, and spills when no register is available. Spills are stored in deterministic symbolic slots such as `SPILL_1`.

## Calling Convention

Arguments are pushed with `PUSH`. Function calls use `CALL name`. Return values use `R0`. `show` lowers to `PRINT`.

## Machine-dependent Optimization

The peephole optimizer conservatively removes:

- `MOV R, R`
- `ADD R, #0`
- `MUL R, #1`
- duplicate adjacent `MOV`
- duplicate adjacent `LOAD`
- `JMP L` immediately followed by `L:`

## Phase Events

Snapshots now cover:

- basic block construction
- CFG construction
- optimization pass events
- register allocation and spills
- target instruction emission
- machine optimization events
- final target readiness

These phases map to:

- `MACHINE_INDEPENDENT_OPTIMIZATION`
- `CODE_GENERATION`
- `MACHINE_DEPENDENT_OPTIMIZATION`
- `TARGET`

## Running

```bash
npm install
npm run test
npm run build
npm run dev
```

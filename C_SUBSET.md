# CompileChrono C Subset

CompileChrono now supports a practical C-style subset while keeping the original Mini Language.

## Supported

- `int`, `float`, `double`, `char`, `bool` scalar declarations
- arithmetic, comparison and logical expressions
- assignments
- `if` / `else`
- `while`
- `++` / `--` as standalone statements
- C-style functions with typed parameters
- `return`
- `printf(...)` / `puts(...)` for one printable value
- `#include ...` lines are ignored
- `//` and `/* ... */` comments

## Runtime model

C `main()` is treated as the program entry point. Its wrapper and C `return` statement are removed so the existing CompileChrono IR/backend/runtime can execute the program directly.

`printf("%d", value)` is represented by the existing `show(value)` operation.

## Current intentional limits

This is a C subset, not an ISO C compiler. The current frontend does not implement:

- arrays and pointers
- structs/unions/enums
- `for`, `switch`, `break`, `continue`
- `scanf` input
- preprocessor macros
- multiple declarators in one declaration
- full C type conversion rules

The project therefore demonstrates a C-oriented frontend connected to the existing compiler pipeline:

C source -> C subset normalization -> lexical analysis -> LL(1) syntax analysis -> AST -> semantic analysis -> IR -> optimization -> target code -> runtime.

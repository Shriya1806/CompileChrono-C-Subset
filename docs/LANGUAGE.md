# CompileChrono Language

The language is intentionally compact so each compiler phase can be inspected.

## Types

- `num` for numeric values.
- `dec` for decimal values.
- `text` for strings.
- Boolean expressions are produced by comparisons and logical operators.

## Statements

```txt
num x = 10;
x = x + 1;
show(x);
```

Blocks use braces. Conditions do not require parentheses:

```txt
if x >= 10 {
    show("large");
} else {
    show("small");
}

while x < 20 {
    x = x + 1;
}
```

Functions use typed parameters and a typed return:

```txt
func num add(num a, num b) {
    return a + b;
}
```

## Operators

Arithmetic: `+`, `-`, `*`, `/`, `%`.

Comparison: `<`, `<=`, `>`, `>=`, `==`, `!=`.

Logical: `&&`, `||`, `!`.

## Diagnostics

The compiler reports lexical, syntax, semantic, and IR errors with source ranges. The UI links diagnostics back to the source editor.

export const samplePrograms = [
  {
    name: "Syntax: Arithmetic",
    source: `num a = 10;
num b = 20;
num result = a + b * 2;
show(result);`
  },
  {
    name: "Syntax: If Else",
    source: `num age = 20;

if age >= 18 {
    show("Eligible");
} else {
    show("Not Eligible");
}`
  },
  {
    name: "Syntax: While",
    source: `num count = 0;

while count < 10 {
    show(count);
    count = count + 1;
}`
  },
  {
    name: "Syntax: Function",
    source: `func num add(num a, num b) {
    return a + b;
}

num result = add(10, 20);
show(result);`
  },
  {
    name: "Phase 5: Arithmetic Output 50",
    source: `num width = 10;
num height = 5;
num area = width * height;
show(area);`
  },
  {
    name: "Phase 5: Function Output 30",
    source: `func num add(num a, num b) {
    return a + b;
}

num result = add(10, 20);
show(result);`
  },
  {
    name: "Phase 5: Optimization Demo",
    source: `num base = 10;
num folded = 2 * 5;
num copy = folded;
num answer = base + copy + 0;
show(answer);`
  },
  {
    name: "Phase 5: Nested Scope",
    source: `num total = 1;

if total < 5 {
    num inner = total + 9;
    show(inner);
}

show(total);`
  },
  {
    name: "Phase 5: Error Path",
    source: `num total = 10;
show(missingValue);`
  },
  {
    name: "Semantic: Decimal Total",
    source: `dec price = 99.5;
num quantity = 2;
dec total = price * quantity;
show(total);`
  },
  {
    name: "Semantic: Type Mismatch",
    source: `num a = 10;
a = "hello";`
  },
  {
    name: "Semantic: Undeclared",
    source: "num x = y + 10;"
  },
  {
    name: "Semantic: Duplicate",
    source: `num x = 10;
num x = 20;`
  },
  {
    name: "Semantic: Bad Condition",
    source: `num x = 10;

if x {
    show(x);
}`
  },
  {
    name: "Semantic: Unknown Function",
    source: "num result = unknown(10);"
  },
  {
    name: "Semantic: Wrong Return",
    source: `func num test() {
    return "hello";
}`
  },
  {
    name: "Lexical Acceptance",
    source: "num result = value123 + 20;"
  },
  {
    name: "Invalid: Missing Semicolon",
    source: "num x = 10"
  },
  {
    name: "Invalid: Expression",
    source: "num x = + ;"
  },
  {
    name: "Invalid: Missing Brace",
    source: `if x > 10 {
    show(x);`
  },
  {
    name: "Invalid: Parentheses",
    source: "show((x + 10);"
  }
];

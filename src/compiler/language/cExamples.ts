export const cSamplePrograms = [
  {
    name: "C: Hello World",
    source: `#include <stdio.h>

int main() {
    printf("Hello, World!");
    return 0;
}`
  },
  {
    name: "C: Arithmetic",
    source: `#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int result = a + b * 2;
    printf("%d", result);
    return 0;
}`
  },
  {
    name: "C: If Else",
    source: `#include <stdio.h>

int main() {
    int age = 20;

    if (age >= 18) {
        printf("Eligible");
    } else {
        printf("Not Eligible");
    }

    return 0;
}`
  },
  {
    name: "C: While Loop",
    source: `#include <stdio.h>

int main() {
    int count = 0;

    while (count < 5) {
        printf("%d", count);
        count++;
    }

    return 0;
}`
  },
  {
    name: "C: Function",
    source: `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(10, 20);
    printf("%d", result);
    return 0;
}`
  }
];

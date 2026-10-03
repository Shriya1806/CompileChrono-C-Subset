export type RegexNode =
  | { kind: "epsilon" }
  | { kind: "literal"; value: string }
  | { kind: "charClass"; label: string; chars?: string[]; ranges?: Array<[string, string]>; negate?: boolean }
  | { kind: "concat"; parts: RegexNode[] }
  | { kind: "alternate"; options: RegexNode[] }
  | { kind: "star"; expr: RegexNode }
  | { kind: "plus"; expr: RegexNode }
  | { kind: "optional"; expr: RegexNode };

export const epsilon = (): RegexNode => ({ kind: "epsilon" });
export const literal = (value: string): RegexNode => ({ kind: "literal", value });
export const charClass = (
  label: string,
  options: { chars?: string[]; ranges?: Array<[string, string]>; negate?: boolean } = {}
): RegexNode => ({ kind: "charClass", label, ...options });
export const concat = (...parts: RegexNode[]): RegexNode => ({ kind: "concat", parts });
export const alternate = (...options: RegexNode[]): RegexNode => ({ kind: "alternate", options });
export const star = (expr: RegexNode): RegexNode => ({ kind: "star", expr });
export const plus = (expr: RegexNode): RegexNode => ({ kind: "plus", expr });
export const optional = (expr: RegexNode): RegexNode => ({ kind: "optional", expr });

export function literalWord(value: string): RegexNode {
  return concat(...value.split("").map(literal));
}

export function regexToDisplay(node: RegexNode): string {
  switch (node.kind) {
    case "epsilon":
      return "epsilon";
    case "literal":
      return escapeDisplay(node.value);
    case "charClass":
      return node.label;
    case "concat":
      return node.parts.map(regexToDisplay).join("");
    case "alternate":
      return `(${node.options.map(regexToDisplay).join("|")})`;
    case "star":
      return `${wrap(node.expr)}*`;
    case "plus":
      return `${wrap(node.expr)}+`;
    case "optional":
      return `${wrap(node.expr)}?`;
  }
}

function wrap(node: RegexNode): string {
  return node.kind === "literal" || node.kind === "charClass" ? regexToDisplay(node) : `(${regexToDisplay(node)})`;
}

function escapeDisplay(value: string): string {
  return /[A-Za-z0-9_]/.test(value) ? value : `\\${value}`;
}

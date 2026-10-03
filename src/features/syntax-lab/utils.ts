import type { AstNode } from "../../compiler/syntax/ast/astTypes";
import type { ParseTreeNode } from "../../compiler/syntax/parser/parserTypes";
import type { TreeGraphNode } from "../../components/visualizations/TreeGraph";

export function parseTreeToGraph(node: ParseTreeNode): TreeGraphNode {
  let category: TreeGraphNode["category"] = "statement";
  const symLower = node.symbol.toLowerCase();
  if (symLower.includes("var") || symLower.includes("id") || symLower.includes("identifier")) {
    category = "variable";
  } else if (symLower.includes("num") || symLower.includes("str") || symLower.includes("literal") || symLower.includes("const")) {
    category = "literal";
  } else if (symLower.includes("op") || symLower.includes("expr") || symLower.includes("term") || symLower.includes("factor")) {
    category = "operation";
  } else if (symLower.includes("if") || symLower.includes("while") || symLower.includes("branch")) {
    category = "branch";
  }

  return {
    id: node.id,
    label: node.symbol,
    detail: node.token?.lexeme,
    category,
    children: node.children.map(parseTreeToGraph)
  };
}

function unwrapSingleStatement(node: AstNode): AstNode {
  if (node.kind === "Block" && node.body.length === 1) {
    return node.body[0];
  }
  return node;
}

export function astToGraph(node: AstNode): TreeGraphNode {
  switch (node.kind) {
    case "Program": {
      const children = node.body.map((child) => ({ node: astToGraph(unwrapSingleStatement(child)) }));
      return {
        id: node.id,
        label: "statement",
        category: "statement",
        children: children.length === 1 ? (children[0].node.children ?? []) : children
      };
    }

    case "IfStatement": {
      const thenNode = unwrapSingleStatement(node.thenBranch);
      const elseNode = node.elseBranch ? unwrapSingleStatement(node.elseBranch) : undefined;
      return {
        id: node.id,
        label: "branch",
        category: "branch",
        children: [
          { node: astToGraph(node.condition), edgeLabel: "condition" },
          { node: astToGraph(thenNode), edgeLabel: "if-body" },
          ...(elseNode ? [{ node: astToGraph(elseNode), edgeLabel: "else-body" }] : [])
        ]
      };
    }

    case "WhileStatement":
      return {
        id: node.id,
        label: "branch",
        detail: "while-loop",
        category: "branch",
        children: [
          { node: astToGraph(node.condition), edgeLabel: "condition" },
          { node: astToGraph(unwrapSingleStatement(node.body)), edgeLabel: "loop-body" }
        ]
      };

    case "BinaryExpression": {
      const isCompare = ["==", "!=", "<", ">", "<=", ">="].includes(node.operator);
      const compareLabels: Record<string, string> = {
        "==": "compare: equal",
        "!=": "compare: not-equal",
        "<": "compare: less-than",
        ">": "compare: greater-than",
        "<=": "compare: less-equal",
        ">=": "compare: greater-equal"
      };
      const label = isCompare
        ? (compareLabels[node.operator] ?? `compare: ${node.operator}`)
        : node.operator === "+"
        ? "operation: add"
        : node.operator === "-"
        ? "operation: subtract"
        : node.operator === "*"
        ? "operation: multiply"
        : node.operator === "/"
        ? "operation: divide"
        : `operation: ${node.operator}`;

      return {
        id: node.id,
        label,
        category: isCompare ? "branch" : "operation",
        children: [
          { node: astToGraph(node.left), edgeLabel: "left" },
          { node: astToGraph(node.right), edgeLabel: "right" }
        ]
      };
    }

    case "UnaryExpression":
      return {
        id: node.id,
        label: `operation: ${node.operator}`,
        category: "operation",
        children: [{ node: astToGraph(node.argument), edgeLabel: "arg" }]
      };

    case "Assignment":
      return {
        id: node.id,
        label: "assignment",
        category: "statement",
        children: [
          { node: astToGraph(node.target), edgeLabel: "target" },
          { node: astToGraph(node.value), edgeLabel: "value" }
        ]
      };

    case "VariableDeclaration":
      return {
        id: node.id,
        label: `var: ${node.name}`,
        detail: node.valueType,
        category: "statement",
        children: node.initializer ? [{ node: astToGraph(node.initializer), edgeLabel: "init" }] : []
      };

    case "Literal":
      return {
        id: node.id,
        label: `literal: ${node.literalType === "string" ? `"${node.value}"` : node.value}`,
        category: "literal",
        children: []
      };

    case "Identifier":
      return {
        id: node.id,
        label: `variable: ${node.name}`,
        category: "variable",
        children: []
      };

    case "Block":
      return {
        id: node.id,
        label: "block",
        category: "statement",
        children: node.body.map((child) => ({ node: astToGraph(child) }))
      };

    case "ShowStatement":
      return {
        id: node.id,
        label: "show",
        category: "statement",
        children: [{ node: astToGraph(node.expression), edgeLabel: "expr" }]
      };

    case "ReturnStatement":
      return {
        id: node.id,
        label: "return",
        category: "statement",
        children: node.value ? [{ node: astToGraph(node.value), edgeLabel: "value" }] : []
      };

    case "FunctionDeclaration":
      return {
        id: node.id,
        label: `func: ${node.name}`,
        detail: `returns ${node.returnType}`,
        category: "statement",
        children: [
          ...node.params.map((p) => ({ node: astToGraph(p), edgeLabel: "param" })),
          { node: astToGraph(unwrapSingleStatement(node.body)), edgeLabel: "body" }
        ]
      };

    case "Parameter":
      return {
        id: node.id,
        label: `param: ${node.name}`,
        detail: node.valueType,
        category: "variable",
        children: []
      };

    case "FunctionCall":
      return {
        id: node.id,
        label: `call: ${node.callee.name}`,
        category: "operation",
        children: node.args.map((a, i) => ({ node: astToGraph(a), edgeLabel: `arg${i + 1}` }))
      };

    default:
      return {
        id: (node as any).id ?? Math.random().toString(),
        label: (node as any).kind ?? "node",
        category: "statement",
        children: []
      };
  }
}

export function astLabel(node: AstNode): string {
  switch (node.kind) {
    case "VariableDeclaration":
      return `VariableDeclaration\n${node.valueType} ${node.name}`;
    case "Assignment":
      return "Assignment";
    case "BinaryExpression":
      return `BinaryExpression\n${node.operator}`;
    case "UnaryExpression":
      return `UnaryExpression\n${node.operator}`;
    case "Literal":
      return `Literal\n${node.value}`;
    case "Identifier":
      return `Identifier\n${node.name}`;
    case "FunctionDeclaration":
      return `FunctionDeclaration\n${node.returnType} ${node.name}`;
    case "FunctionCall":
      return `FunctionCall\n${node.callee.name}`;
    case "Parameter":
      return `Parameter\n${node.valueType} ${node.name}`;
    default:
      return node.kind;
  }
}

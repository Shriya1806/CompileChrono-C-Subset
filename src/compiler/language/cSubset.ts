export type LanguageMode = "mini" | "c";

export interface CNormalizationResult {
  source: string;
  warnings: string[];
}

const C_TYPE_RE = /\b(int|float|double|char|bool)\b/g;
const C_RETURN_TYPE_RE = /\b(int|float|double|char|bool|void)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

function miniType(type: string): string {
  switch (type) {
    case "int":
      return "num";
    case "float":
    case "double":
      return "dec";
    case "char":
      return "text";
    case "bool":
      return "bool";
    case "void":
      return "void";
    default:
      return type;
  }
}

function stripCComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (value) => value.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, "");
}

function stripPreprocessor(source: string): string {
  return source.replace(/^[ \t]*#[^\n]*(?:\n|$)/gm, "");
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function extractMainBody(source: string): { source: string; hadMain: boolean } {
  const mainHeader = /\bint\s+main\s*\(\s*(?:void)?\s*\)\s*\{/m.exec(source);
  if (!mainHeader || mainHeader.index === undefined) return { source, hadMain: false };

  const openIndex = source.indexOf("{", mainHeader.index);
  const closeIndex = findMatchingBrace(source, openIndex);
  if (closeIndex < 0) {
    return { source, hadMain: false };
  }

  const before = source.slice(0, mainHeader.index);
  const body = source.slice(openIndex + 1, closeIndex);
  const after = source.slice(closeIndex + 1);

  // main() is the C program entry point. The existing runtime executes
  // top-level IR directly, so its wrapper is removed after validation.
  const cleanedBody = body.replace(/\breturn\s+[^;]+;/g, "").replace(/\breturn\s*;/g, "");
  return { source: `${before}\n${cleanedBody}\n${after}`, hadMain: true };
}

function splitTopLevelArguments(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (char === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function convertCharLiterals(source: string): string {
  return source.replace(/'([^'\\\\])'/g, '"$1"');
}

function convertPrintf(source: string): string {
  return source.replace(/\bprintf\s*\(([^()]*(?:"[^"]*"[^()]*)?)\)\s*;/g, (_match, args: string) => {
    const values = splitTopLevelArguments(args);

    if (values.length === 0) return "";

    // The runtime's PRINT instruction accepts one value. For the supported
    // C subset, printf("...", value) is represented by printing value.
    if (values.length === 1) return `show(${values[0]});`;

    const format = values[0];
    if (/^"(?:[^"]*)%(?:d|f|c|s)(?:[^"]*)"$/.test(format) && values.length === 2) {
      return `show(${values[1]});`;
    }

    return `show(${values[1]});`;
  }).replace(/\bputs\s*\(([^()]*)\)\s*;/g, (_match, value: string) => `show(${value.trim()});`);
}

function convertIncrementStatements(source: string): string {
  return source
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\+\+\s*;/g, "$1 = $1 + 1;")
    .replace(/\b\+\+\s*([A-Za-z_][A-Za-z0-9_]*)\s*;/g, "$1 = $1 + 1;")
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*--\s*;/g, "$1 = $1 - 1;")
    .replace(/\b--\s*([A-Za-z_][A-Za-z0-9_]*)\s*;/g, "$1 = $1 - 1;");
}

function convertFunctionDefinitions(source: string): string {
  return source.replace(C_RETURN_TYPE_RE, (_match, returnType: string, name: string) => {
    const mappedReturn = miniType(returnType);
    return mappedReturn === "void" ? `func ${name}(` : `func ${mappedReturn} ${name}(`;
  });
}

function convertParameterTypes(source: string): string {
  return source.replace(/\b(int|float|double|char|bool)\s+([A-Za-z_][A-Za-z0-9_]*)/g, (_match, type: string, name: string) => `${miniType(type)} ${name}`);
}

function convertVariableTypes(source: string): string {
  return source.replace(C_TYPE_RE, (type) => miniType(type));
}

export function normalizeCSource(source: string): CNormalizationResult {
  let normalized = stripPreprocessor(stripCComments(source));
  const warnings: string[] = [];

  if (/\bfor\s*\(/.test(normalized)) {
    warnings.push("The current C subset does not support for loops. Use while loops.");
  }
  if (/\bscanf\s*\(/.test(normalized)) {
    warnings.push("The current C subset does not provide runtime input. scanf is not supported.");
  }
  if (/\b(?:struct|switch|case|break|continue|typedef|enum|union)\b/.test(normalized)) {
    warnings.push("This CompileChrono C subset supports structured control flow, scalar variables, functions and printf only.");
  }

  const extracted = extractMainBody(normalized);
  normalized = extracted.source;
  normalized = convertCharLiterals(normalized);
  normalized = convertPrintf(normalized);
  normalized = convertIncrementStatements(normalized);
  normalized = convertFunctionDefinitions(normalized);
  normalized = convertParameterTypes(normalized);
  normalized = convertVariableTypes(normalized);

  // C permits an optional semicolon after a closing block only in a few
  // contexts; the supported subset intentionally leaves unsupported syntax
  // visible so the parser reports it rather than silently accepting it.

  return { source: normalized, warnings };
}

export function languageLabel(language: LanguageMode): string {
  return language === "c" ? "C Subset" : "CompileChrono Mini";
}

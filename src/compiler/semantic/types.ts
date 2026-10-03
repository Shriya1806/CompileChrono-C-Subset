export enum SemanticType {
  NUM = "NUM",
  DEC = "DEC",
  TEXT = "TEXT",
  BOOL = "BOOL",
  VOID = "VOID",
  ERROR = "ERROR"
}

export function typeFromKeyword(keyword: string): SemanticType {
  switch (keyword.toLowerCase()) {
    case "num":
      return SemanticType.NUM;
    case "dec":
      return SemanticType.DEC;
    case "text":
      return SemanticType.TEXT;
    case "bool":
      return SemanticType.BOOL;
    case "void":
      return SemanticType.VOID;
    default:
      return SemanticType.ERROR;
  }
}

export function isNumeric(type: SemanticType) {
  return type === SemanticType.NUM || type === SemanticType.DEC;
}

export function isBoolean(type: SemanticType) {
  return type === SemanticType.BOOL;
}

export function isAssignable(target: SemanticType, source: SemanticType) {
  if (target === SemanticType.ERROR || source === SemanticType.ERROR) return true;
  if (target === source) return true;
  return target === SemanticType.DEC && source === SemanticType.NUM;
}

export function commonNumericType(left: SemanticType, right: SemanticType): SemanticType {
  if (!isNumeric(left) || !isNumeric(right)) return SemanticType.ERROR;
  return left === SemanticType.DEC || right === SemanticType.DEC ? SemanticType.DEC : SemanticType.NUM;
}

export function binaryResultType(operator: string, left: SemanticType, right: SemanticType): SemanticType {
  if (["+", "-", "*", "/", "%"].includes(operator)) {
    if (operator === "+" && left === SemanticType.TEXT && right === SemanticType.TEXT) return SemanticType.TEXT;
    return commonNumericType(left, right);
  }
  if (["<", "<=", ">", ">="].includes(operator)) return isNumeric(left) && isNumeric(right) ? SemanticType.BOOL : SemanticType.ERROR;
  if (["==", "!="].includes(operator)) return isAssignable(left, right) || isAssignable(right, left) ? SemanticType.BOOL : SemanticType.ERROR;
  if (["&&", "||"].includes(operator)) return left === SemanticType.BOOL && right === SemanticType.BOOL ? SemanticType.BOOL : SemanticType.ERROR;
  return SemanticType.ERROR;
}

export function unaryResultType(operator: string, argument: SemanticType): SemanticType {
  if (operator === "!") return argument === SemanticType.BOOL ? SemanticType.BOOL : SemanticType.ERROR;
  if (operator === "-") return isNumeric(argument) ? argument : SemanticType.ERROR;
  return SemanticType.ERROR;
}

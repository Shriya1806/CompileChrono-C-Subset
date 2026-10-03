import { TokenType, booleanLiterals, controlKeywords, dataTypes, keywords } from "./tokens";
import { lexicalRules } from "./lexicalRules";

export const languageSpec = {
  name: "CompileChrono Mini Language",
  version: "phase-1",
  tokenTypes: Object.values(TokenType),
  dataTypes,
  controlKeywords,
  booleanLiterals,
  keywords,
  operators: ["+", "-", "*", "/", "%", "=", "==", "!=", "<", "<=", ">", ">=", "&&", "||", "!"],
  punctuation: ["(", ")", "{", "}", ",", ";"],
  lexicalRules
};

import type { CompilerSnapshot } from "../snapshots/compilerSnapshot";
import type { CompilerEvent } from "../snapshots/compilerEvent";
import type { CompilerError } from "./lexicalError";
import type { Token } from "./token";

export interface LexerResult {
  tokens: Token[];
  errors: CompilerError[];
  snapshots: CompilerSnapshot[];
  events: CompilerEvent[];
}

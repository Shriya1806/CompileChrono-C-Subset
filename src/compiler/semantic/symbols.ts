import type { AstSourceRange } from "../syntax/ast/astTypes";
import type { SemanticType } from "./types";

export type SymbolKind = "VARIABLE" | "FUNCTION" | "PARAMETER";
export type ScopeKind = "GLOBAL" | "FUNCTION" | "BLOCK";

export interface BaseSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  type: SemanticType;
  scopeId: string;
  declarationRange?: AstSourceRange;
  references: AstSourceRange[];
}

export interface VariableSymbol extends BaseSymbol {
  kind: "VARIABLE";
  initialized: boolean;
}

export interface ParameterSymbol extends BaseSymbol {
  kind: "PARAMETER";
  initialized: true;
  position: number;
}

export interface FunctionSymbol extends BaseSymbol {
  kind: "FUNCTION";
  parameters: Array<{ name: string; type: SemanticType; symbolId?: string }>;
}

export type SemanticSymbol = VariableSymbol | ParameterSymbol | FunctionSymbol;

export interface Scope {
  id: string;
  parentScopeId: string | null;
  kind: ScopeKind;
  name: string;
  symbols: string[];
  sourceRange?: AstSourceRange;
}

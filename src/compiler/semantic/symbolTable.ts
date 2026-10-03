import type { AstSourceRange } from "../syntax/ast/astTypes";
import type { FunctionSymbol, ParameterSymbol, Scope, ScopeKind, SemanticSymbol, VariableSymbol } from "./symbols";

type SymbolDeclaration = Omit<VariableSymbol, "id" | "references"> | Omit<ParameterSymbol, "id" | "references"> | Omit<FunctionSymbol, "id" | "references">;

export class SymbolTable {
  readonly scopes = new Map<string, Scope>();
  readonly symbols = new Map<string, SemanticSymbol>();
  private scopeStack: string[] = [];
  private scopeIndex = 0;
  private symbolIndex = 0;

  constructor() {
    this.createScope("GLOBAL", "GLOBAL", undefined, undefined);
  }

  get currentScopeId() {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  createScope(kind: ScopeKind, name: string, sourceRange?: AstSourceRange, parentScopeId = this.currentScopeId): Scope {
    const id = kind === "GLOBAL" ? "SCOPE_GLOBAL" : `SCOPE_${this.scopeIndex++}`;
    const scope: Scope = { id, parentScopeId, kind, name, symbols: [], sourceRange };
    this.scopes.set(id, scope);
    this.scopeStack.push(id);
    return scope;
  }

  exitScope() {
    if (this.scopeStack.length > 1) this.scopeStack.pop();
    return this.currentScopeId;
  }

  declareSymbol(symbol: SymbolDeclaration): { symbol?: SemanticSymbol; duplicate?: SemanticSymbol } {
    const scope = this.scopes.get(symbol.scopeId)!;
    const duplicate = scope.symbols.map((id) => this.symbols.get(id)!).find((item) => item.name === symbol.name);
    if (duplicate) return { duplicate };
    const id = `SYM_${String(this.symbolIndex++).padStart(3, "0")}`;
    const full = { ...symbol, id, references: [] } as unknown as SemanticSymbol;
    this.symbols.set(id, full);
    scope.symbols.push(id);
    return { symbol: full };
  }

  lookupLocal(name: string, scopeId = this.currentScopeId): SemanticSymbol | undefined {
    const scope = this.scopes.get(scopeId);
    return scope?.symbols.map((id) => this.symbols.get(id)!).find((symbol) => symbol.name === name);
  }

  lookup(name: string, scopeId = this.currentScopeId): SemanticSymbol | undefined {
    let cursor: string | null | undefined = scopeId;
    while (cursor) {
      const found = this.lookupLocal(name, cursor);
      if (found) return found;
      cursor = this.scopes.get(cursor)?.parentScopeId;
    }
    return undefined;
  }

  lookupFunction(name: string) {
    const symbol = this.lookup(name, "SCOPE_GLOBAL");
    return symbol?.kind === "FUNCTION" ? symbol : undefined;
  }

  getScopeChain(scopeId = this.currentScopeId): Scope[] {
    const chain: Scope[] = [];
    let cursor: string | null | undefined = scopeId;
    while (cursor) {
      const scope = this.scopes.get(cursor);
      if (!scope) break;
      chain.push(scope);
      cursor = scope.parentScopeId;
    }
    return chain;
  }
}

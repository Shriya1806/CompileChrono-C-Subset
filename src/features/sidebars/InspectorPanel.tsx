import { regexToDisplay } from "../../compiler/automata/regex/regexAst";
import { getLexicalRuleForToken } from "../../compiler/language/lexicalRules";
import { useCompilerStore } from "../../store/compilerStore";

export function InspectorPanel() {
  const tokens = useCompilerStore((state) => state.tokens);
  const selectedTokenId = useCompilerStore((state) => state.selectedTokenId);
  const syntax = useCompilerStore((state) => state.syntax);
  const semantic = useCompilerStore((state) => state.semantic);
  const ir = useCompilerStore((state) => state.ir);
  const backend = useCompilerStore((state) => state.backend);
  const runtime = useCompilerStore((state) => state.runtime);
  const session = useCompilerStore((state) => state.session);
  const token = tokens.find((item) => item.id === selectedTokenId);
  const rule = token ? getLexicalRuleForToken(token.type, token.ruleId) : undefined;

  return (
    <div className="space-y-4 p-3 text-xs text-black">
      <section>
        <h3 className="mb-2 font-black uppercase text-black">Selected Token</h3>
        {token && rule ? (
          <div className="space-y-2 rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
            <Line label="Lexeme" value={token.lexeme} mono />
            <Line label="Type" value={token.type} />
            <Line label="Rule" value={rule.name} />
            <Line label="Position" value={`Line ${token.line}, Column ${token.column}`} />
            <Line label="Regex" value={regexToDisplay(rule.regex)} mono />
          </div>
        ) : (
          <div className="text-zinc-600 font-medium">Click a token to inspect source mapping and its lexical rule.</div>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-black uppercase text-black">Trace Links</h3>
        <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
          <Line label="Trace Entries" value={String(session.traceMap.entries.length)} />
          <Line label="Runtime Events" value={String(runtime?.events.length ?? 0)} />
        </div>
      </section>
      <section>
        <h3 className="mb-2 font-black uppercase text-black">Syntax Analysis</h3>
        {syntax ? (
          <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
            <Line label="Parser" value={syntax.parseResult.accepted ? "Accepted" : "Syntax errors"} />
            <Line label="Productions" value={String(syntax.grammar.productions.length)} />
            <Line label="Parser Steps" value={String(syntax.parseResult.steps.length)} />
            <Line label="LL(1) Conflicts" value={String(syntax.parsingTable.conflicts.length)} />
          </div>
        ) : (
          <div className="text-zinc-600 font-medium">Syntax analysis waits for a valid token stream.</div>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-black uppercase text-black">Semantic / IR</h3>
        <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
          <Line label="Semantic" value={semantic ? `${semantic.errors.length} error(s)` : "Not run"} />
          <Line label="Symbols" value={String(semantic?.symbols.length ?? 0)} />
          <Line label="Scopes" value={String(semantic?.scopes.length ?? 0)} />
          <Line label="TAC Instructions" value={String(ir?.instructions.length ?? 0)} />
          <Line label="Basic Blocks" value={String(backend?.basicBlocks.length ?? 0)} />
          <Line label="Final Target" value={String(backend?.machineOptimization.finalTarget.length ?? 0)} />
          <Line label="Runtime Output" value={runtime?.finalState.output.join(", ") || "Not run"} />
        </div>
      </section>
    </div>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-zinc-500">{label}</div>
      <div className={mono ? "font-mono font-bold text-black" : "font-bold text-black"}>{value}</div>
    </div>
  );
}


import { regexToDisplay } from "../../../compiler/automata/regex/regexAst";
import { lexicalRules } from "../../../compiler/language/lexicalRules";
import { selectCurrentRule, useCompilerStore } from "../../../store/compilerStore";

export function LexicalRulesPanel() {
  const selectedRuleId = useCompilerStore((state) => state.selectedRuleId);
  const selectRule = useCompilerStore((state) => state.selectRule);
  const rule = useCompilerStore(selectCurrentRule);

  return (
    <div className="grid h-full grid-cols-[260px_minmax(0,1fr)]">
      <div className="overflow-auto border-r border-slate-800 cc-scrollbar">
        {lexicalRules.map((item) => (
          <button
            key={item.id}
            onClick={() => selectRule(item.id)}
            className={`block w-full border-b border-slate-900 px-3 py-2 text-left text-xs hover:bg-slate-900 ${
              selectedRuleId === item.id ? "bg-cyan-500/10 text-cyan-100" : "text-slate-300"
            }`}
          >
            <div className="font-semibold">{item.name}</div>
            <div className="font-mono text-[11px] text-slate-500">{item.tokenType}</div>
          </button>
        ))}
      </div>
      <div className="space-y-4 overflow-auto p-4 text-sm cc-scrollbar">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Selected Rule</div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{rule.name}</h3>
          <p className="mt-2 max-w-3xl text-slate-400">{rule.description}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Token Type" value={rule.tokenType} />
          <Info label="Priority" value={String(rule.priority)} />
          <Info label="JavaScript Matcher" value={rule.pattern} mono />
          <Info label="Automata Regex" value={regexToDisplay(rule.regex)} mono />
        </div>
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Examples</div>
          <div className="flex flex-wrap gap-2">
            {rule.examples.map((example) => (
              <span key={example} className="border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200">
                {example}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-slate-800 bg-slate-900/50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-slate-200 ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</div>
    </div>
  );
}

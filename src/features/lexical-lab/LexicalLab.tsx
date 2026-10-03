import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { TokenTable } from "./tokens/TokenTable";
import { NfaPanel } from "./nfa/NfaPanel";
import { DfaPanel } from "./dfa/DfaPanel";
import { MinimizedDfaPanel } from "./minimization/MinimizedDfaPanel";
import { useCompilerStore, selectCurrentRule } from "../../store/compilerStore";
import { lexicalRules } from "../../compiler/language/lexicalRules";

const tabs = ["Tokens", "NFA", "DFA", "Min DFA"] as const;
type Tab = (typeof tabs)[number];

const featuredRuleIds = ["identifier", "integer", "string", "keyword", "eq", "plus"];

export function LexicalLab() {
  const [tab, setTab] = useState<Tab>("Tokens");
  const currentRule = useCompilerStore(selectCurrentRule);
  const selectRule = useCompilerStore((state) => state.selectRule);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black bg-white px-3 py-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
        {tab !== "Tokens" && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-extrabold uppercase tracking-wide text-black mr-1">Rule:</span>
            {featuredRuleIds.map((ruleId) => {
              const rule = lexicalRules.find((r) => r.id === ruleId);
              if (!rule) return null;
              const isSelected = currentRule.id === rule.id;
              return (
                <button
                  key={rule.id}
                  onClick={() => selectRule(rule.id)}
                  className={`rounded px-2 py-0.5 text-xs font-bold border-2 border-black transition-all ${
                    isSelected ? "bg-[#FEF08A] text-black shadow-[1.5px_1.5px_0px_0px_#000]" : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                  title={rule.pattern}
                >
                  {rule.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Tokens" && <TokenTable />}
        {tab === "NFA" && <NfaPanel />}
        {tab === "DFA" && <DfaPanel />}
        {tab === "Min DFA" && <MinimizedDfaPanel />}
      </BrutalTabPanel>
    </div>
  );
}

import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { AnnotatedAstPanel } from "./AnnotatedAstPanel";
import { ScopeTreePanel } from "./ScopeTreePanel";
import { SemanticChecksPanel } from "./SemanticChecksPanel";
import { SymbolTablePanel } from "./SymbolTablePanel";

const tabs = ["Checks", "Symbol Table", "Scope Tree", "Annotated AST"] as const;
type Tab = (typeof tabs)[number];

export function SemanticLab() {
  const [tab, setTab] = useState<Tab>("Checks");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Checks" && <SemanticChecksPanel />}
        {tab === "Symbol Table" && <SymbolTablePanel />}
        {tab === "Scope Tree" && <ScopeTreePanel />}
        {tab === "Annotated AST" && <AnnotatedAstPanel />}
      </BrutalTabPanel>
    </div>
  );
}


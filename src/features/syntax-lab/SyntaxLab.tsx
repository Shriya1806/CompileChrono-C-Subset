import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { GrammarPanel } from "./GrammarPanel";
import { FirstFollowPanel } from "./FirstFollowPanel";
import { ParsingTablePanel } from "./ParsingTablePanel";
import { ParsingStackPanel } from "./ParsingStackPanel";
import { ParseTreePanel } from "./ParseTreePanel";
import { AstPanel } from "./AstPanel";

const tabs = ["Syntax Tree", "Grammar", "FIRST / FOLLOW", "Parsing Table", "Parse Stack", "AST"] as const;
type Tab = (typeof tabs)[number];

export function SyntaxLab() {
  const [tab, setTab] = useState<Tab>("Syntax Tree");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Syntax Tree" && <ParseTreePanel />}
        {tab === "Grammar" && <GrammarPanel />}
        {tab === "FIRST / FOLLOW" && <FirstFollowPanel />}
        {tab === "Parsing Table" && <ParsingTablePanel />}
        {tab === "Parse Stack" && <ParsingStackPanel />}
        {tab === "AST" && <AstPanel />}
      </BrutalTabPanel>
    </div>
  );
}


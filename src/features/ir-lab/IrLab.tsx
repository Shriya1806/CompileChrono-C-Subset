import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { CfgPanel } from "../backend-lab/CfgPanel";
import { TacPanel } from "./TacPanel";

const tabs = ["Intermediate Code", "CFG"] as const;
type Tab = (typeof tabs)[number];

export function IrLab() {
  const [tab, setTab] = useState<Tab>("Intermediate Code");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Intermediate Code" && <TacPanel />}
        {tab === "CFG" && <CfgPanel />}
      </BrutalTabPanel>
    </div>
  );
}


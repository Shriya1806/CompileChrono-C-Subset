import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { GeneratedTargetPanel } from "./GeneratedTargetPanel";
import { InstructionSelectionPanel } from "./InstructionSelectionPanel";
import { RegisterPanel } from "./RegisterPanel";

const tabs = ["Machine Code", "Registers", "Mapping"] as const;
type Tab = (typeof tabs)[number];

export function CodegenLab() {
  const [tab, setTab] = useState<Tab>("Machine Code");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Machine Code" && <GeneratedTargetPanel />}
        {tab === "Registers" && <RegisterPanel />}
        {tab === "Mapping" && <InstructionSelectionPanel />}
      </BrutalTabPanel>
    </div>
  );
}


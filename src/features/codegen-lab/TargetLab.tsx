import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { GeneratedTargetPanel } from "./GeneratedTargetPanel";

export function TargetLab() {
  const tabs = ["Before Optimization", "Final Target"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Final Target");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Before Optimization" && <GeneratedTargetPanel final={false} />}
        {tab === "Final Target" && <GeneratedTargetPanel final={true} />}
      </BrutalTabPanel>
    </div>
  );
}


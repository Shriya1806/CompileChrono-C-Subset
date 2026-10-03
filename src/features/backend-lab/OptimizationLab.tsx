import { useState } from "react";
import { BrutalTabPanel, BrutalTabs } from "../../components/brutal/BrutalPrimitives";
import { BeforeAfterPanel } from "./BeforeAfterPanel";
import { OptimizedIrPanel } from "./OptimizedIrPanel";

const tabs = ["Optimized Code", "Compare"] as const;
type Tab = (typeof tabs)[number];

export function OptimizationLab() {
  const [tab, setTab] = useState<Tab>("Optimized Code");
  return (
    <div className="grid h-full grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Optimized Code" && <OptimizedIrPanel />}
        {tab === "Compare" && <BeforeAfterPanel />}
      </BrutalTabPanel>
    </div>
  );
}


import { useCompilerStore } from "../../store/compilerStore";

export function PipelinePanel() {
  const statuses = useCompilerStore((state) => state.session.phaseStatuses);
  const jumpToPhase = useCompilerStore((state) => state.jumpToPhase);

  return (
    <div className="space-y-2 p-3 text-black">
      {statuses.map((phase) => (
        <button
          key={phase.phase}
          onClick={() => jumpToPhase(phase.phase)}
          className={`block w-full rounded-xl border-2 border-black p-3 text-left text-xs font-black shadow-[2px_2px_0px_0px_#000000] transition-transform hover:-translate-y-0.5 ${classForStatus(phase.status)}`}
          title={phase.summary}
        >
          <div className="truncate uppercase text-black">{String(phase.phase).replace(/_/g, " ")}</div>
          <div className="mt-1 flex justify-between gap-2 text-[10px] font-bold uppercase text-black/70">
            <span>{phase.status}</span>
            <span>{phase.eventCount} events</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function classForStatus(status: string) {
  if (status === "FAILED") return "bg-[#FCA5A5]";
  if (status === "SKIPPED") return "bg-zinc-100";
  return "bg-[#BAE6FD]";
}


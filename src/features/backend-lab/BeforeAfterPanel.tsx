import { useCompilerStore } from "../../store/compilerStore";

export function BeforeAfterPanel() {
  const backend = useCompilerStore((state) => state.backend);
  if (!backend) return <div className="p-4 text-xs font-bold text-black">No comparison available.</div>;

  const beforeLines = backend.optimization.originalIR.map((inst) => inst.text);
  const afterLines = backend.optimization.optimizedIR.map((inst) => inst.text);
  const afterSet = new Set(afterLines);
  const beforeSet = new Set(beforeLines);

  return (
    <div className="grid h-full grid-cols-2 gap-3 p-3 bg-white text-black">
      <div className="flex flex-col min-h-0 rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
        <div className="mb-2 text-xs font-black uppercase text-black border-b-2 border-black pb-2 flex items-center justify-between">
          <span>BEFORE OPTIMIZATION</span>
          <span className="rounded border border-black bg-[#FEF08A] px-2 py-0.5 text-[10px] font-black text-black">
            {beforeLines.length} Instructions
          </span>
        </div>
        <div className="flex-1 overflow-auto space-y-1.5 font-mono text-xs cc-scrollbar">
          {beforeLines.map((line, idx) => {
            const isRemoved = !afterSet.has(line);
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded-md border border-black px-2 py-1 ${
                  isRemoved ? "bg-[#FCA5A5] font-bold" : "bg-white"
                }`}
              >
                <span className="text-zinc-500 text-[10px]">{String(idx + 1).padStart(2, "0")}</span>
                <span>{line}</span>
                {isRemoved && <span className="ml-auto text-[9px] font-black uppercase text-red-900">REMOVED</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col min-h-0 rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000000]">
        <div className="mb-2 text-xs font-black uppercase text-black border-b-2 border-black pb-2 flex items-center justify-between">
          <span>AFTER OPTIMIZATION</span>
          <span className="rounded border border-black bg-[#BAE6FD] px-2 py-0.5 text-[10px] font-black text-black">
            {afterLines.length} Instructions
          </span>
        </div>
        <div className="flex-1 overflow-auto space-y-1.5 font-mono text-xs cc-scrollbar">
          {afterLines.map((line, idx) => {
            const isNewOrFolded = !beforeSet.has(line);
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 rounded-md border border-black px-2 py-1 ${
                  isNewOrFolded ? "bg-[#FEF08A] font-bold" : "bg-[#BAE6FD] font-bold"
                }`}
              >
                <span className="text-zinc-500 text-[10px]">{String(idx + 1).padStart(2, "0")}</span>
                <span>{line}</span>
                {isNewOrFolded && <span className="ml-auto text-[9px] font-black uppercase text-amber-900">OPTIMIZED</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


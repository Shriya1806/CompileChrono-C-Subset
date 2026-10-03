import { useCompilerStore } from "../../store/compilerStore";

export function TacPanel() {
  const ir = useCompilerStore((state) => state.ir);
  const selected = useCompilerStore((state) => state.selectedIrInstructionId);
  const select = useCompilerStore((state) => state.selectIrInstruction);

  if (!ir) return <div className="p-4 text-xs font-bold text-black">IR is generated after successful semantic analysis.</div>;

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar bg-white">
      <div className="rounded-xl border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000000] font-mono text-xs">
        {ir.instructions.map((instruction, index) => {
          const isSelected = selected === instruction.id;
          const lineNum = String(index + 1).padStart(2, "0");
          return (
            <div
              key={instruction.id}
              onClick={() => select(instruction.id)}
              className={`flex items-center gap-3 rounded-md px-2 py-1 cursor-pointer transition-colors ${
                isSelected ? "bg-[#FEF08A] font-bold" : "hover:bg-zinc-50"
              }`}
            >
              <span className="rounded border border-black bg-[#FEF08A] px-2 py-0.5 text-[10px] font-black text-black select-none">
                {lineNum}
              </span>
              <span className="text-black font-semibold">{instruction.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


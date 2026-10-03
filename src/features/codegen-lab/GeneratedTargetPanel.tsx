import { useCompilerStore } from "../../store/compilerStore";

export function GeneratedTargetPanel({ final = false }: { final?: boolean }) {
  const instructions = useCompilerStore((state) =>
    final ? state.backend?.machineOptimization.finalTarget : state.backend?.target.targetInstructions
  );
  const selected = useCompilerStore((state) => state.selectedTargetInstructionId);
  const selectTarget = useCompilerStore((state) => state.selectTargetInstruction);

  if (!instructions) return <div className="p-4 text-xs font-bold text-black">No target code generated yet.</div>;

  return (
    <div className="h-full overflow-auto p-3 cc-scrollbar bg-white text-black">
      <div className="rounded-xl border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000000]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              <th>#</th>
              <th>Opcode</th>
              <th>Operands</th>
              <th>Mapped IR</th>
            </tr>
          </thead>
          <tbody>
            {instructions.map((instruction, index) => {
              const isSelected = selected === instruction.id;
              return (
                <tr
                  key={instruction.id}
                  onClick={() => selectTarget(instruction.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FEF08A] font-bold" : "hover:bg-zinc-50 text-black"
                  }`}
                >
                  <td className="font-mono font-bold text-black">{index + 1}</td>
                  <td className="font-mono font-bold text-[#EF4444]">{instruction.opcode}</td>
                  <td className="font-mono text-black">{instruction.operands.map((op) => op.value).join(", ")}</td>
                  <td className="font-mono text-zinc-600">{instruction.sourceIrIds.join(", ") || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


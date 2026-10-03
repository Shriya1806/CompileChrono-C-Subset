import { useCompilerStore } from "../../store/compilerStore";

export function RegisterPanel() {
  const events = useCompilerStore((state) => state.backend?.target.events ?? []);
  const instructions = useCompilerStore((state) => state.backend?.target.targetInstructions ?? []);

  if (events.length === 0 && instructions.length === 0) {
    return <div className="p-4 text-xs font-bold text-black">No register allocation activity.</div>;
  }

  // Find the last event where register assignments were recorded
  const lastActiveEvent = [...events]
    .reverse()
    .find((e) => e.registerState && Object.values(e.registerState.registers).some((v) => v !== null));

  const registerMap: Record<string, string | null> =
    lastActiveEvent?.registerState?.registers ?? inferRegistersFromInstructions(instructions);

  const spills: Record<string, string> = lastActiveEvent?.registerState?.spills ?? {};

  const tones = ["bg-[#FEF08A]", "bg-[#BAE6FD]", "bg-[#FCA5A5]", "bg-white"];

  return (
    <div className="h-full overflow-auto p-4 cc-scrollbar bg-white text-black">
      <div className="mb-3 text-xs font-black uppercase text-black">Register Allocation</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-6">
        {Object.entries(registerMap).map(([register, value], index) => {
          const isUsed = value !== null;
          const bg = isUsed ? tones[index % tones.length] : "bg-white";
          return (
            <div
              key={register}
              className={`rounded-xl border-2 border-black p-3 text-center shadow-[2px_2px_0px_0px_#000000] ${bg}`}
            >
              <div className="font-mono text-sm font-black text-black">{register}</div>
              <div className="mt-1 font-mono text-xs font-extrabold text-black">
                {String(value ?? "free")}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(spills).length > 0 && (
        <>
          <div className="mb-3 text-xs font-black uppercase text-black">Spill Slots</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {Object.entries(spills).map(([value, slot]) => (
              <div
                key={value}
                className="rounded-xl border-2 border-black bg-[#FCA5A5] p-3 text-center shadow-[2px_2px_0px_0px_#000000]"
              >
                <div className="font-mono text-xs font-black text-black">{value}</div>
                <div className="mt-1 font-mono text-[11px] font-bold text-black">→ {slot}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function inferRegistersFromInstructions(instructions: Array<{ operands: Array<{ kind: string; value: string }> }>) {
  const map: Record<string, string | null> = { R0: null, R1: null, R2: null, R3: null };
  for (const inst of instructions) {
    const memOp = inst.operands.find((op) => op.kind === "MEMORY")?.value;
    for (const op of inst.operands) {
      if (op.kind === "REGISTER" && op.value in map) {
        if (!map[op.value]) {
          map[op.value] = memOp ?? "in-use";
        }
      }
    }
  }
  return map;
}



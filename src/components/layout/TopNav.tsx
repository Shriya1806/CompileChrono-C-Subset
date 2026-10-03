import { RotateCcw, Play, Code2 } from "lucide-react";
import { samplePrograms } from "../../compiler/language/examples";
import { BrutalButton, BrutalSelect } from "../brutal/BrutalPrimitives";
import { useCompilerStore } from "../../store/compilerStore";

export function TopNav() {
  const compile = useCompilerStore((state) => state.compile);
  const reset = useCompilerStore((state) => state.reset);
  const loadExample = useCompilerStore((state) => state.loadExample);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b-[2.5px] border-black bg-white px-4">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg border-2 border-black bg-[#FEF08A] text-sm font-black text-black shadow-[2px_2px_0px_0px_#000000]">
          <Code2 size={18} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight text-black">CompileChrono</span>
          <span className="rounded-full border border-black bg-[#BAE6FD] px-2 py-0.5 text-[10px] font-black uppercase text-black">
            v0.1
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <BrutalSelect
          onChange={(event) => loadExample(Number(event.target.value))}
          defaultValue="0"
          aria-label="Load example program"
        >
          {samplePrograms.map((example, index) => (
            <option key={example.name} value={index}>
              {example.name}
            </option>
          ))}
        </BrutalSelect>

        <BrutalButton onClick={reset}>
          <RotateCcw size={14} />
          Reset
        </BrutalButton>

        <BrutalButton tone="yellow" onClick={compile}>
          <Play size={14} className="fill-black" />
          Compile
        </BrutalButton>
      </div>
    </header>
  );
}


import { Play, RotateCcw, StepForward } from "lucide-react";
import { motion } from "framer-motion";
import { BrutalButton } from "../../components/brutal/BrutalPrimitives";
import { useCompilerStore } from "../../store/compilerStore";

export function ParsingStackPanel() {
  const syntax = useCompilerStore((state) => state.syntax);
  const tokens = useCompilerStore((state) => state.tokens);
  const parserStepIndex = useCompilerStore((state) => state.parserStepIndex);
  const setParserStepIndex = useCompilerStore((state) => state.setParserStepIndex);
  const nextParserStep = useCompilerStore((state) => state.nextParserStep);
  if (!syntax) return <div className="p-4 text-xs font-bold text-black">Parser did not run.</div>;
  const step = syntax.parseResult.steps[parserStepIndex];
  const input = tokens.slice(step?.tokenIndex ?? 0, Math.min(tokens.length, (step?.tokenIndex ?? 0) + 12));

  return (
    <div className="grid h-full grid-cols-[280px_minmax(0,1fr)] bg-white text-black">
      <div className="border-r-2 border-black p-4 flex flex-col min-h-0">
        <div className="mb-3 flex items-center justify-between text-xs font-black uppercase text-black">
          <span>Step {parserStepIndex + 1} / {syntax.parseResult.steps.length}</span>
        </div>
        <div className="flex gap-2">
          <BrutalButton onClick={() => setParserStepIndex(0)}>
            <RotateCcw size={14} /> Reset
          </BrutalButton>
          <BrutalButton tone="blue" onClick={nextParserStep}>
            <StepForward size={14} /> Step
          </BrutalButton>
          <BrutalButton tone="yellow" onClick={() => setParserStepIndex(syntax.parseResult.steps.length - 1)}>
            <Play size={14} className="fill-black" /> Auto
          </BrutalButton>
        </div>

        <div className="mt-4 text-xs font-black uppercase text-black">Stack</div>
        <div className="mt-2 flex flex-col-reverse gap-1.5 overflow-auto p-1 cc-scrollbar">
          {(step?.stack ?? []).map((symbol, index) => {
            const isTop = index === (step?.stack.length ?? 0) - 1;
            return (
              <motion.div
                key={`${symbol}-${index}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between rounded-lg border-2 border-black px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000000] ${
                  isTop ? "bg-[#FEF08A]" : "bg-white"
                }`}
              >
                <span>{symbol}</span>
                {isTop && <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-black uppercase text-white">TOP</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[100px_minmax(0,1fr)]">
        <div className="border-b-2 border-black p-4">
          <div className="text-xs font-black uppercase text-black">Lookahead Input</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {input.map((token, index) => (
              <span
                key={token.id}
                className={`rounded-lg border-2 border-black px-2.5 py-1 font-mono text-xs shadow-[2px_2px_0px_0px_#000000] ${
                  index === 0 ? "bg-[#FEF08A] font-bold" : "bg-white text-black"
                }`}
              >
                {token.lexeme}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 overflow-auto">
          <div className="text-xs font-black uppercase text-black">Action</div>
          <div className="mt-2 rounded-xl border-2 border-black bg-[#BAE6FD] p-3 text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000]">
            {step?.action}
          </div>
          {step?.selectedProductionId && (
            <div className="mt-3 rounded-lg border-2 border-black bg-white p-2 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000]">
              Production: {step.selectedProductionId}
            </div>
          )}
          {step?.selectedTableCell && (
            <div className="mt-2 rounded-lg border-2 border-black bg-[#FEF08A] p-2 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000000]">
              Table Cell: M[{step.selectedTableCell.nonTerminal}, {step.selectedTableCell.terminal}]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


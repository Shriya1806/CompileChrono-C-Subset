import { Cpu, Monitor, Play, RotateCcw, Rows3, StepForward, TerminalSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrutalButton } from "../../components/brutal/BrutalPrimitives";
import { useCompilerStore } from "../../store/compilerStore";

export function RuntimeLab() {
  const runtime = useCompilerStore((state) => state.runtime);
  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setStepIndex(0);
    setRunning(false);
  }, [runtime]);

  useEffect(() => {
    if (!running || !runtime) return;
    const timer = window.setInterval(() => {
      setStepIndex((index) => {
        const next = Math.min(index + 1, runtime.states.length - 1);
        if (next >= runtime.states.length - 1) setRunning(false);
        return next;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [running, runtime]);

  const lastStepIndex = Math.max(0, (runtime?.states.length ?? 1) - 1);
  const selectedRuntimeState = runtime?.states[Math.min(stepIndex, lastStepIndex)] ?? runtime?.finalState;

  if (!runtime) {
    return <div className="p-4 text-xs font-bold text-black">Runtime waits for a semantically valid program and target code.</div>;
  }

  const currentInstruction =
    runtime.instructions.find((instruction) => instruction.id === selectedRuntimeState?.currentInstructionId) ??
    runtime.instructions[Math.min(selectedRuntimeState?.pc ?? stepIndex, Math.max(0, runtime.instructions.length - 1))];
  const activeInstructionId = currentInstruction?.id;

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] bg-white text-xs text-black">
      <div className="min-h-0 overflow-auto border-r-2 border-black p-3">
        <SectionTitle
          icon={<Cpu size={14} />}
          title="Target Execution"
          action={
            <div className="flex gap-2">
              <BrutalButton onClick={() => { setRunning(false); setStepIndex(0); }}><RotateCcw size={14} />Reset</BrutalButton>
              <BrutalButton tone="blue" onClick={() => setStepIndex((index) => Math.min(index + 1, lastStepIndex))}><StepForward size={14} />Step</BrutalButton>
              <BrutalButton tone="yellow" onClick={() => setRunning((value) => !value)}><Play size={14} className="fill-black" />Run</BrutalButton>
            </div>
          }
        />
        <div className="mb-2 inline-flex rounded-lg border-2 border-black bg-[#FEF08A] px-3 py-1 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
          Step {Math.min(stepIndex, lastStepIndex) + 1} / {runtime.states.length}
        </div>
        <div className="mt-2 space-y-1.5 font-mono">
          {runtime.instructions.map((instruction, index) => (
            <motion.div
              key={instruction.id}
              layout
              animate={{ scale: instruction.id === activeInstructionId ? 1.01 : 1 }}
              className={`grid grid-cols-[44px_minmax(0,1fr)] rounded-lg border-2 border-black px-2.5 py-1.5 text-xs shadow-[2px_2px_0px_0px_#000000] ${
                instruction.id === activeInstructionId ? "bg-[#FCA5A5] font-bold" : "bg-white"
              }`}
            >
              <span className="text-zinc-500">{String(index).padStart(2, "0")}</span>
              <span>{instruction.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid min-h-0 grid-rows-[1fr_1fr]">
        <div className="grid min-h-0 grid-cols-2 border-b-2 border-black">
          <RuntimeTable title="Registers" icon={<Rows3 size={14} />} values={selectedRuntimeState?.registers ?? {}} />
          <RuntimeTable title="Memory" icon={<Rows3 size={14} />} values={selectedRuntimeState?.memory ?? {}} />
        </div>
        <div className="grid min-h-0 grid-cols-2">
          <div className="min-h-0 overflow-auto border-r-2 border-black p-3">
            <SectionTitle icon={<TerminalSquare size={14} />} title="Call Stack" />
            <div className="mt-2 space-y-1.5">
              {(selectedRuntimeState?.callStack ?? []).map((frame, index) => (
                <motion.div
                  key={`${frame.functionName}-${index}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border-2 border-black bg-[#BAE6FD] p-2 font-black shadow-[2px_2px_0px_0px_#000000]"
                >
                  <div>{frame.functionName}</div>
                  <div className="font-mono text-[11px]">return pc {frame.returnPc}</div>
                </motion.div>
              ))}
              {(selectedRuntimeState?.callStack.length ?? 0) === 0 && <div className="text-zinc-500 font-medium">No active calls.</div>}
            </div>
          </div>
          <div className="min-h-0 overflow-auto p-3">
            <SectionTitle icon={<Monitor size={14} />} title="Output" />
            <pre className="mt-2 min-h-20 whitespace-pre-wrap rounded-lg border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000000]">
              {(selectedRuntimeState?.output ?? []).join("\n") || "No output yet."}
            </pre>
            {currentInstruction && (
              <div className="mt-3 rounded-lg border-2 border-black bg-[#FEF08A] p-2 font-black shadow-[2px_2px_0px_0px_#000000]">
                Current: <span className="font-mono">{currentInstruction.text}</span>
              </div>
            )}
            {selectedRuntimeState?.error && (
              <div className="mt-2 rounded-lg border-2 border-black bg-[#FCA5A5] p-2 font-black shadow-[2px_2px_0px_0px_#000000]">
                {selectedRuntimeState.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RuntimeTable({ title, icon, values }: { title: string; icon: React.ReactNode; values: Record<string, unknown> }) {
  return (
    <div className="min-h-0 overflow-auto border-r-2 border-black p-3 last:border-r-0">
      <SectionTitle icon={icon} title={title} />
      <div className="mt-2 space-y-1.5">
        {Object.entries(values).map(([key, value]) => (
          <motion.div
            key={key}
            layout
            className="flex justify-between rounded-lg border-2 border-black bg-white px-2.5 py-1 font-mono shadow-[2px_2px_0px_0px_#000000]"
          >
            <span className="text-zinc-500">{key}</span>
            <span className="font-black">{String(value ?? "null")}</span>
          </motion.div>
        ))}
        {Object.keys(values).length === 0 && <div className="text-zinc-500 font-medium">Empty.</div>}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black uppercase text-black">
      <span className="flex items-center gap-2">{icon}{title}</span>
      {action}
    </div>
  );
}


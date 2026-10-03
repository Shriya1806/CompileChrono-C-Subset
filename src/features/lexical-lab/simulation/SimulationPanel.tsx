import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useMemo } from "react";
import { AutomataGraph } from "../../../components/visualizations/AutomataGraph";
import { dfaAccepts, runDfaSimulation } from "../../../compiler/automata/simulation/dfaSimulation";
import { useCompilerStore } from "../../../store/compilerStore";

export function SimulationPanel() {
  const automata = useCompilerStore((state) => state.automata);
  const input = useCompilerStore((state) => state.simulationInput);
  const setInput = useCompilerStore((state) => state.setSimulationInput);
  const simulationStep = useCompilerStore((state) => state.simulationStep);
  const setSimulationStep = useCompilerStore((state) => state.setSimulationStep);
  const nextSimulationStep = useCompilerStore((state) => state.nextSimulationStep);
  const resetSimulation = useCompilerStore((state) => state.resetSimulation);
  const steps = useMemo(() => runDfaSimulation(automata.minimizedDfa, input), [automata.minimizedDfa, input]);
  const current = steps[Math.min(simulationStep, steps.length - 1)];
  const accepted = dfaAccepts(automata.minimizedDfa, input);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_120px]">
      <div className="flex items-center gap-2 border-b border-slate-800 p-3">
        <input
          className="h-9 min-w-0 flex-1 border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none focus:border-cyan-500"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Enter lexeme to simulate"
        />
        <button className="grid h-9 w-9 place-items-center border border-slate-700 text-slate-200 hover:border-slate-500" onClick={resetSimulation} title="Reset simulation">
          <RotateCcw size={15} />
        </button>
        <button className="grid h-9 w-9 place-items-center border border-slate-700 text-slate-200 hover:border-slate-500" onClick={() => setSimulationStep(steps.length - 1)} title="Run to end">
          <Play size={15} />
        </button>
        <button className="grid h-9 w-9 place-items-center border border-slate-700 text-slate-200 hover:border-slate-500" title="Pause">
          <Pause size={15} />
        </button>
        <button className="grid h-9 w-9 place-items-center border border-cyan-600 text-cyan-100 hover:bg-cyan-500/10" onClick={nextSimulationStep} title="Step">
          <StepForward size={15} />
        </button>
      </div>
      <AutomataGraph
        automaton={automata.minimizedDfa}
        activeStates={current ? [current.toState] : []}
        activeTransitionIds={current?.transitionId ? [current.transitionId] : []}
      />
      <div className="grid grid-cols-5 gap-2 border-t border-slate-800 p-3 text-xs">
        <Info label="Current char" value={current?.char ?? "start"} />
        <Info label="State" value={current?.toState ?? automata.minimizedDfa.startState} />
        <Info label="Remaining input" value={input.slice(simulationStep)} />
        <Info label="Step" value={`${simulationStep} / ${Math.max(0, steps.length - 1)}`} />
        <Info label="Result" value={current?.rejected ? "REJECTED" : simulationStep === steps.length - 1 && accepted ? "ACCEPTED" : "RUNNING"} accent={accepted && simulationStep === steps.length - 1} />
      </div>
    </div>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-slate-800 bg-slate-900/50 p-2">
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className={`mt-1 truncate font-mono ${accent ? "text-emerald-300" : "text-slate-200"}`}>{value || "none"}</div>
    </div>
  );
}

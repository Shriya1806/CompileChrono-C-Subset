import { useEffect, useState } from "react";
import { Boxes, Braces, Bug, Cpu, FileCode2, Gauge, Network, Rows3, TerminalSquare, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { BrutalPanel, BrutalTabPanel, BrutalTabs } from "../components/brutal/BrutalPrimitives";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { TopNav } from "../components/layout/TopNav";
import { BasicBlocksPanel } from "../features/backend-lab/BasicBlocksPanel";
import { CfgPanel } from "../features/backend-lab/CfgPanel";
import { OptimizationLab } from "../features/backend-lab/OptimizationLab";
import { CodegenLab } from "../features/codegen-lab/CodegenLab";
import { TargetLab } from "../features/codegen-lab/TargetLab";
import { EditorPanel } from "../features/editor/EditorPanel";
import { IrLab } from "../features/ir-lab/IrLab";
import { LexicalLab } from "../features/lexical-lab/LexicalLab";
import { RuntimeLab } from "../features/runtime-lab/RuntimeLab";
import { SemanticLab } from "../features/semantic-lab/SemanticLab";
import { SyntaxLab } from "../features/syntax-lab/SyntaxLab";
import { useCompilerStore, type Workspace } from "../store/compilerStore";

const phaseNav: Array<{ id: Workspace; label: string; icon: React.ReactNode; tone: "yellow" | "blue" | "red" }> = [
  { id: "source", label: "Source", icon: <FileCode2 size={16} />, tone: "yellow" },
  { id: "lexical", label: "Lexical", icon: <Rows3 size={16} />, tone: "blue" },
  { id: "syntax", label: "Syntax", icon: <Braces size={16} />, tone: "red" },
  { id: "semantic", label: "Semantic", icon: <Bug size={16} />, tone: "yellow" },
  { id: "ir", label: "IR", icon: <TerminalSquare size={16} />, tone: "blue" },
  { id: "optimization", label: "Optimize", icon: <Wand2 size={16} />, tone: "yellow" },
  { id: "codegen", label: "Codegen", icon: <Cpu size={16} />, tone: "blue" },
  { id: "target", label: "Target", icon: <Boxes size={16} />, tone: "red" },
  { id: "runtime", label: "Runtime", icon: <Gauge size={16} />, tone: "yellow" }
];

export function Playground() {
  const workspace = useCompilerStore((state) => state.workspace);
  const setWorkspace = useCompilerStore((state) => state.setWorkspace);
  const compile = useCompilerStore((state) => state.compile);
  const errors = useCompilerStore((state) => state.errors);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        compile();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compile]);

  return (
    <div className="grid h-screen grid-rows-[56px_minmax(0,1fr)] bg-white text-black">
      <TopNav />
      <main className="grid min-h-0 grid-cols-[100px_minmax(0,1fr)] gap-3 p-3">
        <aside className="brutal-panel overflow-auto p-2">
          <nav className="flex flex-col gap-2">
            {phaseNav.map((item) => {
              const isActive = workspace === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setWorkspace(item.id)}
                  className={`flex h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000000] transition-all ${
                    isActive ? activeTone(item.tone) : "bg-white hover:bg-zinc-50"
                  }`}
                  title={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </aside>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
          <BrutalPanel title={workspaceTitle(workspace)} className="overflow-hidden">
            <ErrorBoundary>
              {workspace === "source" && <EditorPanel />}
              {workspace === "lexical" && <LexicalLab />}
              {workspace === "syntax" && <SyntaxLab />}
              {workspace === "semantic" && <SemanticLab />}
              {workspace === "ir" && <IrLab />}
              {workspace === "optimization" && <OptimizationLab />}
              {workspace === "codegen" && <CodegenLab />}
              {workspace === "target" && <TargetLab />}
              {workspace === "runtime" && <RuntimeLab />}
            </ErrorBoundary>
          </BrutalPanel>

          {errors.length > 0 && <ErrorDrawer />}
        </div>
      </main>
    </div>
  );
}


function ErrorDrawer() {
  const [open, setOpen] = useState(false);
  const errors = useCompilerStore((state) => state.errors);
  const selectError = useCompilerStore((state) => state.selectError);
  return (
    <div className="brutal-panel border-2 border-black bg-[#FCA5A5]">
      <button className="flex w-full items-center justify-between p-2.5 text-left" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-xs font-black uppercase text-black">
          <Bug size={16} />
          {errors.length} Compilation Errors
        </span>
        <span className="rounded-md border border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase text-black">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="grid max-h-36 gap-2 overflow-auto border-t-2 border-black p-2.5">
          {errors.map((error) => (
            <button
              key={error.id}
              onClick={() => selectError(error.id)}
              className="rounded-lg border-2 border-black bg-white p-2 text-left text-xs shadow-[2px_2px_0px_0px_#000000] transition-transform hover:translate-x-0.5"
            >
              <div className="font-black uppercase text-black">{error.phase} Error</div>
              <div className="font-mono text-[11px] text-zinc-800">
                Line {error.line}: {error.message}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CfgWorkspace() {
  const tabs = ["Blocks", "CFG"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Blocks");
  return (
    <div className="grid h-full min-h-0 grid-rows-[48px_minmax(0,1fr)]">
      <div className="flex items-center px-3 pt-2">
        <BrutalTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <BrutalTabPanel id={tab}>
        {tab === "Blocks" && <BasicBlocksPanel />}
        {tab === "CFG" && <CfgPanel />}
      </BrutalTabPanel>
    </div>
  );
}

function activeTone(tone: "yellow" | "blue" | "red") {
  if (tone === "blue") return "bg-[#BAE6FD]";
  if (tone === "red") return "bg-[#FCA5A5]";
  return "bg-[#FEF08A]";
}

function workspaceTitle(workspace: Workspace) {
  if (workspace === "source") return "Source Code";
  if (workspace === "lexical") return "Lexical Analysis";
  if (workspace === "syntax") return "Syntax Analysis";
  if (workspace === "semantic") return "Semantic Analysis";
  if (workspace === "ir") return "Intermediate Representation";
  if (workspace === "cfg") return "Control Flow Graph";
  if (workspace === "optimization") return "Machine-Independent Optimization";
  if (workspace === "codegen") return "Code Generation";
  if (workspace === "target") return "Target Assembly Code";
  if (workspace === "runtime") return "Runtime Virtual Machine";
  return "CompileChrono";
}


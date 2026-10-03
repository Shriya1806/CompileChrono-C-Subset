import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { DFA, NFA } from "../../compiler/automata/models";
import { transitionLabel } from "../../compiler/automata/models";

interface AutomataGraphProps {
  automaton: NFA | DFA;
  graphId?: string;
  activeStates?: string[];
  activeTransitionIds?: string[];
  highlightedStates?: string[];
}

export function AutomataGraph({
  automaton,
  activeStates = [],
  activeTransitionIds = [],
  highlightedStates = []
}: AutomataGraphProps) {
  const nodes: Node[] = automaton.states.map((state, index) => {
    const isStart = state.id === automaton.startState;
    const isAccept = automaton.acceptStates.includes(state.id);
    const isActive = activeStates.includes(state.id);
    const isHighlighted = highlightedStates.includes(state.id);

    let bgClass = "bg-white";
    if (isActive) bgClass = "bg-[#FCA5A5]";
    else if (isStart) bgClass = "bg-[#FEF08A]";
    else if (isAccept || isHighlighted) bgClass = "bg-[#BAE6FD]";

    return {
      id: state.id,
      position: positionFor(index, automaton.states.length),
      data: { label: state.label },
      className: [
        "border-[2px]",
        "border-black",
        "text-black",
        "font-extrabold",
        "shadow-[1.5px_1.5px_0px_0px_#000000]",
        isAccept ? "ring-2 ring-black ring-offset-1" : "",
        bgClass
      ].join(" "),
      style: {
        width: 44,
        height: 44,
        borderRadius: "999px",
        display: "grid",
        placeItems: "center",
        fontSize: 11
      }
    };
  });

  const edges: Edge[] = automaton.transitions.map((transition) => {
    const isActive = activeTransitionIds.includes(transition.id);
    const isSelfLoop = transition.from === transition.to;
    return {
      id: transition.id,
      source: transition.from,
      target: transition.to,
      animated: isActive,
      label: transitionLabel(transition.symbol),
      type: isSelfLoop ? "smoothstep" : "default",
      style: {
        stroke: isActive ? "#EF4444" : "#000000",
        strokeWidth: isActive ? 2.5 : 2
      },
      labelStyle: { fill: "#000000", fontSize: 10, fontWeight: 800 },
      labelBgStyle: { fill: "#FEF08A", stroke: "#000000", strokeWidth: 1.5 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      markerEnd: { type: "arrowclosed", color: isActive ? "#EF4444" : "#000000" }
    };
  });

  return (
    <div className="h-full min-h-[280px] bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.3} maxZoom={1.5}>
        <Background color="#000000" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function positionFor(index: number, count: number) {
  const columns = Math.ceil(Math.sqrt(count));
  const row = Math.floor(index / columns);
  const column = index % columns;
  return {
    x: column * 140 + (row % 2) * 20,
    y: row * 95 + 15
  };
}

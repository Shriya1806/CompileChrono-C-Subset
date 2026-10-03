import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useCompilerStore } from "../../store/compilerStore";

export function CfgPanel() {
  const cfg = useCompilerStore((state) => state.backend?.cfg ?? null);
  if (!cfg) return <div className="p-4 text-xs font-bold text-black">No CFG generated yet.</div>;

  const nodes: Node[] = cfg.nodes.map((block, index) => {
    // Structured 2-column alternating layout with ample vertical and horizontal gaps
    const col = index % 2;
    const row = Math.floor(index / 2);
    return {
      id: block.id,
      position: { x: col * 360 + 60, y: row * 220 + 40 },
      data: {
        label: `${block.id}\n${block.instructions.slice(0, 5).map((inst) => inst.text).join("\n")}`
      },
      style: {
        whiteSpace: "pre-line",
        width: 240,
        border: "2.5px solid #000000",
        borderRadius: 10,
        background: index % 3 === 0 ? "#FEF08A" : index % 3 === 1 ? "#BAE6FD" : "#FFFFFF",
        color: "#000000",
        padding: 12,
        fontSize: 11,
        fontWeight: 800,
        boxShadow: "3px 3px 0px 0px #000000"
      }
    };
  });

  const edges: Edge[] = cfg.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    label: edge.label,
    type: "smoothstep",
    animated: edge.type === "BACK_EDGE",
    style: { stroke: "#000000", strokeWidth: edge.type === "BACK_EDGE" ? 3 : 2.5 },
    labelStyle: { fill: "#000000", fontWeight: 900, fontSize: 11 },
    labelBgStyle: {
      fill:
        edge.type === "TRUE_BRANCH"
          ? "#BAE6FD"
          : edge.type === "FALSE_BRANCH"
          ? "#FCA5A5"
          : edge.type === "BACK_EDGE"
          ? "#FEF08A"
          : "#FFFFFF",
      stroke: "#000000",
      strokeWidth: 2
    },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 4,
    markerEnd: { type: "arrowclosed", color: "#000000" }
  }));

  return (
    <div className="h-full bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.25}>
        <Background color="#000000" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}



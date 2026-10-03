import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useMemo } from "react";

export interface TreeChild {
  node: TreeGraphNode;
  edgeLabel?: string;
}

export interface TreeGraphNode {
  id: string;
  label: string;
  detail?: string;
  category?: "statement" | "branch" | "operation" | "variable" | "literal";
  children?: (TreeGraphNode | TreeChild)[];
}

interface TreeGraphProps {
  root: TreeGraphNode | null;
  activeNodeId?: string | null;
  onNodeClick?: (id: string) => void;
}

export function TreeGraph({ root, activeNodeId, onNodeClick }: TreeGraphProps) {
  if (!root) return <div className="grid h-full place-items-center text-xs font-bold text-black">No tree structure.</div>;
  const { nodes, edges } = useMemo(() => layoutTree(root), [root]);
  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          background: node.id === activeNodeId ? "#FCA5A5" : node.style?.background
        }
      })),
    [nodes, activeNodeId]
  );
  return (
    <div className="h-full min-h-[360px] bg-white">
      <ReactFlow nodes={displayNodes} edges={edges} fitView minZoom={0.2} maxZoom={1.5} onNodeClick={(_, node) => onNodeClick?.(node.id)}>
        <Background color="#000000" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function normalizeChildren(rawChildren?: (TreeGraphNode | TreeChild)[]): TreeChild[] {
  if (!rawChildren) return [];
  return rawChildren.map((item) => {
    if (typeof item === "object" && item !== null && "node" in item && (item as TreeChild).node) {
      return item as TreeChild;
    }
    return { node: item as TreeGraphNode };
  });
}

interface SubtreeInfo {
  treeNode: TreeGraphNode;
  edgeLabel?: string;
  width: number;
  children: SubtreeInfo[];
}

function buildSubtreeInfo(node: TreeGraphNode, edgeLabel?: string): SubtreeInfo {
  const normChildren = normalizeChildren(node.children);
  if (normChildren.length === 0) {
    return {
      treeNode: node,
      edgeLabel,
      width: 160,
      children: []
    };
  }
  const childrenInfo = normChildren.map((c) => buildSubtreeInfo(c.node, c.edgeLabel));
  const childrenTotalWidth = childrenInfo.reduce((sum, child) => sum + child.width, 0);
  const width = Math.max(160, childrenTotalWidth);
  return {
    treeNode: node,
    edgeLabel,
    width,
    children: childrenInfo
  };
}

function positionSubtree(
  info: SubtreeInfo,
  leftX: number,
  depth: number,
  nodes: Node[],
  edges: Edge[],
  parentId?: string
) {
  const nodeWidth = 135;
  const nodeMinHeight = 48;
  const levelYGap = 100;

  const centerX = leftX + info.width / 2;
  const x = centerX - nodeWidth / 2;
  const y = depth * levelYGap;

  const category = info.treeNode.category ?? "statement";
  let bg = "#BEF264"; // Lime green for statements/branches/operations
  if (category === "variable") {
    bg = "#FEF9C3"; // Soft cream yellow for variables
  } else if (category === "literal") {
    bg = "#FAE8FF"; // Soft pink/lavender for literals
  }

  nodes.push({
    id: info.treeNode.id,
    position: { x, y },
    data: { label: info.treeNode.detail ? `${info.treeNode.label}\n${info.treeNode.detail}` : info.treeNode.label },
    style: {
      width: nodeWidth,
      minHeight: nodeMinHeight,
      border: "2.5px solid #000000",
      borderRadius: 6,
      background: bg,
      color: "#000000",
      padding: "6px 8px",
      fontSize: 11,
      fontWeight: 800,
      boxShadow: "2.5px 2.5px 0px 0px #000000",
      whiteSpace: "pre-line",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  });

  if (parentId) {
    edges.push({
      id: `${parentId}-${info.treeNode.id}`,
      source: parentId,
      target: info.treeNode.id,
      label: info.edgeLabel,
      labelStyle: info.edgeLabel ? { fill: "#000000", fontWeight: 800, fontSize: 10 } : undefined,
      labelBgStyle: info.edgeLabel ? { fill: "#FFFFFF", stroke: "#000000", strokeWidth: 1.5, rx: 4, ry: 4 } : undefined,
      labelBgPadding: [4, 2],
      style: { stroke: "#000000", strokeWidth: 2 }
    });
  }

  let currentChildLeft = leftX;
  for (const childInfo of info.children) {
    positionSubtree(childInfo, currentChildLeft, depth + 1, nodes, edges, info.treeNode.id);
    currentChildLeft += childInfo.width;
  }
}

function layoutTree(root: TreeGraphNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const rootInfo = buildSubtreeInfo(root);
  positionSubtree(rootInfo, 0, 0, nodes, edges);
  return { nodes, edges };
}

import React, { useMemo } from "react";
import { BTree, BTreeNode } from "../dsa/BTree";

interface BTreeVisualizerProps {
  tree: BTree;
  highlightKey?: bigint | null;
}

interface VisualNode {
  node: BTreeNode;
  x: number;
  y: number;
  width: number;
  children: VisualNode[];
}

export const BTreeVisualizer: React.FC<BTreeVisualizerProps> = ({ tree, highlightKey }) => {
  const root = tree.root;

  // Constants for B-Tree node rendering
  const keyWidth = 60;
  const keyHeight = 35;
  const nodePadding = 10;
  const levelGap = 80;
  const childGap = 30;

  // Recursively calculate nodes layout coordinates
  const layout = useMemo(() => {
    if (!root) return null;

    function buildLayout(node: BTreeNode, depth: number, xStart: number): VisualNode {
      const nodeW = node.keys.length * keyWidth + nodePadding * 2;
      const y = depth * levelGap + 30;

      if (node.isLeaf) {
        return {
          node,
          x: xStart + nodeW / 2,
          y,
          width: nodeW,
          children: [],
        };
      } else {
        const childrenLayouts: VisualNode[] = [];
        let currentX = xStart;
        let totalChildrenWidth = 0;

        for (const child of node.children) {
          const childLayout = buildLayout(child, depth + 1, currentX);
          childrenLayouts.push(childLayout);
          currentX += childLayout.width + childGap;
          totalChildrenWidth += childLayout.width + childGap;
        }
        totalChildrenWidth -= childGap; // remove last gap

        // The parent position is centered relative to its children's span
        const x = xStart + totalChildrenWidth / 2;
        return {
          node,
          x,
          y,
          width: Math.max(totalChildrenWidth, nodeW),
          children: childrenLayouts,
        };
      }
    }

    return buildLayout(root, 0, 10);
  }, [root, tree.root]);

  // Recursively gather all nodes and lines to render
  const elements = useMemo(() => {
    if (!layout) return { nodes: [], lines: [], dimensions: { width: 0, height: 0 } };

    const nodesToRender: { vNode: VisualNode; id: string }[] = [];
    const linesToRender: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
    let maxX = 0;
    let maxY = 0;

    function traverse(vNode: VisualNode) {
      nodesToRender.push({ vNode, id: `${vNode.node.keys.map(k => k.key.toString()).join("-")}-${vNode.x}-${vNode.y}` });
      maxX = Math.max(maxX, vNode.x + vNode.width / 2);
      maxY = Math.max(maxY, vNode.y + keyHeight + 50);

      const nodeW = vNode.node.keys.length * keyWidth + nodePadding * 2;
      const nodeXStart = vNode.x - nodeW / 2;

      for (let i = 0; i < vNode.children.length; i++) {
        const child = vNode.children[i];
        // In a B-Tree, child pointer lines originate from spacing between keys (or node boundaries)
        // Child i is between key i-1 and key i.
        // We space these out along the bottom of the parent node
        const ptrX = nodeXStart + nodePadding + i * keyWidth;
        const ptrY = vNode.y + keyHeight;

        linesToRender.push({
          x1: ptrX,
          y1: ptrY,
          x2: child.x,
          y2: child.y,
          id: `${vNode.x}-${vNode.y}-to-${child.x}-${child.y}`,
        });

        traverse(child);
      }
    }

    traverse(layout);

    return {
      nodes: nodesToRender,
      lines: linesToRender,
      dimensions: {
        width: maxX + 50,
        height: maxY + 50,
      },
    };
  }, [layout]);

  if (!root || !layout) {
    return (
      <div className="btree-empty">
        <p>This node's B-Tree is currently empty.</p>
        <span className="btree-hint">Add files to see them indexed in the B-Tree structure.</span>
      </div>
    );
  }

  return (
    <div className="btree-canvas-container">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${elements.dimensions.width} ${elements.dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="btree-svg"
      >
        {/* Draw Connection Lines */}
        {elements.lines.map(line => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="btree-line"
          />
        ))}

        {/* Draw Nodes */}
        {elements.nodes.map(({ vNode, id }) => {
          const nodeW = vNode.node.keys.length * keyWidth + nodePadding * 2;
          const nodeXStart = vNode.x - nodeW / 2;

          return (
            <g key={id} className="btree-node-group">
              {/* Node Outer Box (Glassmorphic Container) */}
              <rect
                x={nodeXStart}
                y={vNode.y}
                width={nodeW}
                height={keyHeight}
                rx={6}
                className="btree-node-bg"
              />

              {/* Render Key Boxes & Separators */}
              {vNode.node.keys.map((pair, idx) => {
                const keyX = nodeXStart + nodePadding + idx * keyWidth;
                const isHighlighted = highlightKey !== undefined && highlightKey !== null && pair.key === highlightKey;

                return (
                  <g key={pair.key.toString()} className="btree-key-group">
                    {/* Key Box */}
                    <rect
                      x={keyX + 2}
                      y={vNode.y + 2}
                      width={keyWidth - 4}
                      height={keyHeight - 4}
                      rx={4}
                      className={`btree-key-box ${isHighlighted ? "btree-key-highlight" : ""}`}
                    />

                    {/* Key Text */}
                    <text
                      x={keyX + keyWidth / 2}
                      y={vNode.y + keyHeight / 2 + 4}
                      textAnchor="middle"
                      className="btree-key-text"
                    >
                      {pair.key.toString()}
                    </text>

                    {/* Tooltip Overlay / Interactive Title */}
                    <title>
                      {`Key: ${pair.key}\nFile: ${pair.fileName}\nSHA-1 Hash: ${pair.hash}\nContent: "${pair.content}"`}
                    </title>

                    {/* Draw separator line between keys */}
                    {idx < vNode.node.keys.length - 1 && (
                      <line
                        x1={keyX + keyWidth}
                        y1={vNode.y}
                        x2={keyX + keyWidth}
                        y2={vNode.y + keyHeight}
                        className="btree-separator"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

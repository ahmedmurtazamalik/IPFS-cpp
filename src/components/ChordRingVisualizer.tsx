import React, { useMemo } from "react";
import { ChordNode } from "../dsa/ChordRing";

interface ChordRingVisualizerProps {
  m: number;
  nodes: ChordNode[];
  selectedNodeId: bigint | null;
  onSelectNode: (id: bigint) => void;
  activePath: bigint[];
  currentPathIndex: number;
}

export const ChordRingVisualizer: React.FC<ChordRingVisualizerProps> = ({
  m,
  nodes,
  selectedNodeId,
  onSelectNode,
  activePath,
  currentPathIndex,
}) => {
  const cx = 200;
  const cy = 200;
  const r = 140;

  const maxSpace = 1n << BigInt(m);
  const isSmallSpace = m <= 6; // Draw all tick marks if size <= 64

  // Map each active node to its angle and coordinates
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; theta: number }>();
    if (nodes.length === 0) return positions;

    nodes.forEach((node, index) => {
      let theta = 0;
      if (isSmallSpace) {
        // Position on the exact tick mark corresponding to its key ID
        theta = (Number(node.id) / Number(maxSpace)) * 2 * Math.PI - Math.PI / 2;
      } else {
        // Uniformly space active nodes around the circle in sorted order
        theta = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
      }
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      positions.set(node.id.toString(), { x, y, theta });
    });

    return positions;
  }, [nodes, m, isSmallSpace, maxSpace]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (selectedNodeId === null) return null;
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Tick marks for small spaces
  const ticks = useMemo(() => {
    if (!isSmallSpace) return [];
    const tickList: { x1: number; y1: number; x2: number; y2: number; labelX: number; labelY: number; label: string }[] = [];
    const spaceSize = Number(maxSpace);

    for (let i = 0; i < spaceSize; i++) {
      const theta = (i / spaceSize) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + (r - 4) * Math.cos(theta);
      const y1 = cy + (r - 4) * Math.sin(theta);
      const x2 = cx + (r + 4) * Math.cos(theta);
      const y2 = cy + (r + 4) * Math.sin(theta);

      // Label offsets slightly outward
      const labelDistance = r + 16;
      const labelX = cx + labelDistance * Math.cos(theta);
      const labelY = cy + labelDistance * Math.sin(theta) + 4; // adjust vertical alignment

      // Only label every tick if <= 16, or every 2nd tick if <= 32, or every 4th if <= 64
      let showLabel = false;
      if (spaceSize <= 16) showLabel = true;
      else if (spaceSize <= 32) showLabel = i % 2 === 0;
      else showLabel = i % 4 === 0;

      tickList.push({
        x1, y1, x2, y2,
        labelX, labelY,
        label: showLabel ? i.toString() : "",
      });
    }

    return tickList;
  }, [isSmallSpace, maxSpace]);

  // Helper to draw clean arc paths between nodes
  const getArcPath = (x1: number, y1: number, x2: number, y2: number, isShortCut: boolean = false) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy);

    if (isShortCut) {
      // Finger shortcuts are drawn as slight curves inside the circle
      // Curvature radius is proportional to distance
      const sweep = 0; // 0 for straight line, 1 for curved
      return `M ${x1} ${y1} A ${dr * 1.5} ${dr * 1.5} 0 0 ${sweep} ${x2} ${y2}`;
    }

    // Successor links (outer circle path)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  // Get active packet positions for search/insert routing animations
  const packetCoords = useMemo(() => {
    if (activePath.length === 0 || currentPathIndex < 0 || currentPathIndex >= activePath.length) {
      return null;
    }
    const activeId = activePath[currentPathIndex];
    const pos = nodePositions.get(activeId.toString());
    return pos ? { x: pos.x, y: pos.y } : null;
  }, [activePath, currentPathIndex, nodePositions]);

  return (
    <div className="chord-ring-svg-container">
      <svg width="100%" height="100%" viewBox="0 0 400 400" className="chord-ring-svg">
        <defs>
          {/* Arrow markers for successor links */}
          <marker
            id="successor-arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ring-successor)" />
          </marker>

          {/* Arrow markers for finger table shortcuts */}
          <marker
            id="finger-arrow"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ring-finger)" />
          </marker>
        </defs>

        {/* Ring Base Circle */}
        <circle cx={cx} cy={cy} r={r} className="chord-ring-base" />

        {/* Ticks & Labels (For small space) */}
        {ticks.map((tick, idx) => (
          <g key={idx} className="chord-tick-group">
            <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} className="chord-tick-line" />
            {tick.label && (
              <text x={tick.labelX} y={tick.labelY} textAnchor="middle" className="chord-tick-label">
                {tick.label}
              </text>
            )}
          </g>
        ))}

        {/* Direct Successor Links (Circle boundary paths) */}
        {nodes.map(node => {
          const fromPos = nodePositions.get(node.id.toString());
          const toPos = nodePositions.get(node.successor.id.toString());
          if (!fromPos || !toPos || node.id === node.successor.id) return null;

          return (
            <path
              key={`succ-${node.id}`}
              d={getArcPath(fromPos.x, fromPos.y, toPos.x, toPos.y)}
              className="chord-link-successor"
              markerEnd="url(#successor-arrow)"
            />
          );
        })}

        {/* Selected Node's Finger Table Shortcuts (Lines passing through circle interior) */}
        {selectedNode &&
          selectedNode.fingerTable.map((fingerNode, idx) => {
            const fromPos = nodePositions.get(selectedNode.id.toString());
            const toPos = nodePositions.get(fingerNode.id.toString());
            if (!fromPos || !toPos || selectedNode.id === fingerNode.id) return null;

            // Draw a unique finger link to each distinct node in the table
            // We want to avoid drawing overlapping lines if multiple table entries point to the same node
            // But we can check if it is the first occurrence of this target in the finger table
            const firstOccurIndex = selectedNode.fingerTable.findIndex(fn => fn.id === fingerNode.id);
            if (firstOccurIndex !== idx) return null; // Deduplicate visual lines

            return (
              <path
                key={`finger-${idx}`}
                d={getArcPath(fromPos.x, fromPos.y, toPos.x, toPos.y, true)}
                className="chord-link-finger"
                markerEnd="url(#finger-arrow)"
              />
            );
          })}

        {/* Highlight direct successor and predecessor for selected node */}
        {selectedNode && (
          <>
            {/* Direct Predecessor Link */}
            {selectedNode.predecessor && (
              <circle
                cx={nodePositions.get(selectedNode.predecessor.id.toString())?.x}
                cy={nodePositions.get(selectedNode.predecessor.id.toString())?.y}
                r={12}
                className="chord-node-predecessor-outline"
              />
            )}
            {/* Direct Successor Link */}
            {selectedNode.successor && (
              <circle
                cx={nodePositions.get(selectedNode.successor.id.toString())?.x}
                cy={nodePositions.get(selectedNode.successor.id.toString())?.y}
                r={12}
                className="chord-node-successor-outline"
              />
            )}
          </>
        )}

        {/* Draw Active Routing Path Hops */}
        {activePath.length > 0 &&
          activePath.map((nodeId, idx) => {
            if (idx >= currentPathIndex) return null; // Only show path traversed so far
            const fromPos = nodePositions.get(nodeId.toString());
            const nextNodeId = activePath[idx + 1];
            if (!nextNodeId || idx >= currentPathIndex) return null;
            const toPos = nodePositions.get(nextNodeId.toString());
            if (!fromPos || !toPos) return null;

            // Highlight path segment
            const isFingerHop = nodes.find(n => n.id === nodeId)?.successor.id !== nextNodeId;

            return (
              <path
                key={`path-hop-${idx}`}
                d={getArcPath(fromPos.x, fromPos.y, toPos.x, toPos.y, isFingerHop)}
                className="chord-path-highlight"
              />
            );
          })}

        {/* Node Circles */}
        {nodes.map(node => {
          const pos = nodePositions.get(node.id.toString());
          if (!pos) return null;

          const isSelected = node.id === selectedNodeId;
          const isInPath = activePath.slice(0, currentPathIndex + 1).includes(node.id);

          return (
            <g
              key={node.id.toString()}
              onClick={() => onSelectNode(node.id)}
              className={`chord-node-group ${isSelected ? "selected" : ""} ${isInPath ? "in-path" : ""}`}
            >
              {/* Outer pulsing ring for selected/in-path nodes */}
              {isSelected && <circle cx={pos.x} cy={pos.y} r={14} className="chord-node-pulse" />}
              {isInPath && <circle cx={pos.x} cy={pos.y} r={12} className="chord-node-active-ring" />}

              {/* Central Node Circle */}
              <circle cx={pos.x} cy={pos.y} r={8} className="chord-node-circle" />

              {/* Node ID Label */}
              <text
                x={pos.x}
                y={pos.theta < 0 || pos.theta > Math.PI ? pos.y - 14 : pos.y + 18}
                textAnchor="middle"
                className="chord-node-label"
              >
                {/* Truncate label for 160-bit space (Hex key) to make it neat */}
                {m === 160
                  ? `0x${node.id.toString(16).slice(0, 4)}..`
                  : node.id.toString()}
              </text>
            </g>
          );
        })}

        {/* Query Packet Animation Dot (glowing particle) */}
        {packetCoords && (
          <circle
            cx={packetCoords.x}
            cy={packetCoords.y}
            r={6}
            className="chord-packet-dot"
          />
        )}
      </svg>
    </div>
  );
};

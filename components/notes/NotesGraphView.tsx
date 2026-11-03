"use client";

// ============================================================================
// Sahil's Shore: Notes Knowledge Graph Visualizer
// 2D SVG interactive network view showing connected notes and backlink edges
// ============================================================================

import React, { useMemo, useState } from "react";
import type { NotesGraphData } from "@/lib/notes";
import { Network, X, ZoomIn, ZoomOut, Maximize2, FileText } from "lucide-react";

interface NotesGraphViewProps {
  graphData: NotesGraphData;
  activeNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onClose?: () => void;
}

const FOLDER_COLORS: Record<string, string> = {
  General: "#1F7A8C",
  Engineering: "#3B82F6",
  German: "#E0A458",
  DSA: "#10B981",
  Ideas: "#8B5CF6",
  Personal: "#EC4899",
  Reflections: "#F59E0B",
};

export function NotesGraphView({
  graphData,
  activeNoteId,
  onSelectNote,
  onClose,
}: NotesGraphViewProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute 2D node coordinates in a circular / multi-ring layout
  const { nodePositions, width, height } = useMemo(() => {
    const w = 700;
    const h = 500;
    const centerX = w / 2;
    const centerY = h / 2;
    const nodes = graphData.nodes;
    const positions = new Map<string, { x: number; y: number }>();

    if (nodes.length === 0) return { nodePositions: positions, width: w, height: h };

    if (nodes.length === 1) {
      positions.set(nodes[0].id, { x: centerX, y: centerY });
      return { nodePositions: positions, width: w, height: h };
    }

    // Sort active or highest-link nodes towards the center
    const sorted = [...nodes].sort((a, b) => b.linkCount - a.linkCount);

    sorted.forEach((node, idx) => {
      if (idx === 0) {
        positions.set(node.id, { x: centerX, y: centerY });
      } else {
        // Multi-ring distribution
        const ring = Math.floor((idx - 1) / 8) + 1;
        const indexInRing = (idx - 1) % 8;
        const ringTotal = Math.min(8, sorted.length - 1 - (ring - 1) * 8);
        const radius = ring * 90;
        const angle = (indexInRing / ringTotal) * 2 * Math.PI + (ring * 0.4);

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.set(node.id, { x, y });
      }
    });

    return { nodePositions: positions, width: w, height: h };
  }, [graphData.nodes]);

  return (
    <div className="relative rounded-3xl border border-border bg-surface p-5 shadow-lg space-y-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">Notes Knowledge Graph</h3>
            <p className="text-xs text-text-muted">
              {graphData.nodes.length} notes • {graphData.edges.length} backlink connections
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-border p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface-muted/20 flex items-center justify-center min-h-[460px]">
        {graphData.nodes.length === 0 ? (
          <div className="text-xs text-text-muted">No notes available to map yet.</div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full max-h-[500px] select-none"
          >
            {/* Edges */}
            {graphData.edges.map((edge, idx) => {
              const p1 = nodePositions.get(edge.source);
              const p2 = nodePositions.get(edge.target);
              if (!p1 || !p2) return null;

              const isHighlighted =
                hoveredNodeId === edge.source ||
                hoveredNodeId === edge.target ||
                activeNoteId === edge.source ||
                activeNoteId === edge.target;

              return (
                <line
                  key={`${edge.source}-${edge.target}-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isHighlighted ? "#1F7A8C" : "var(--border)"}
                  strokeWidth={isHighlighted ? 2.5 : 1}
                  strokeOpacity={isHighlighted ? 0.9 : 0.4}
                  strokeDasharray={isHighlighted ? undefined : "3,3"}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const isActive = activeNoteId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const folderColor = FOLDER_COLORS[node.folder] || "#1F7A8C";
              const radius = Math.max(12, Math.min(24, 12 + node.linkCount * 3));

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => onSelectNote(node.id)}
                >
                  {/* Outer halo if active or hovered */}
                  {(isActive || isHovered) && (
                    <circle
                      r={radius + 6}
                      fill={folderColor}
                      fillOpacity={0.2}
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r={radius}
                    fill="var(--surface)"
                    stroke={isActive ? "#1F7A8C" : folderColor}
                    strokeWidth={isActive ? 3.5 : 2}
                    className="shadow-sm"
                  />

                  {/* Inner dot */}
                  <circle r={4} fill={folderColor} />

                  {/* Label */}
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    fill="var(--text)"
                    fontSize={10}
                    fontWeight={isActive || isHovered ? 700 : 500}
                    className="pointer-events-none drop-shadow-sm font-sans"
                  >
                    {node.title.length > 18 ? `${node.title.slice(0, 16)}…` : node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-text-muted">
        <span className="font-semibold text-text">Folders:</span>
        {Object.entries(FOLDER_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

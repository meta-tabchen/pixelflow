import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from 'reactflow';
import { X } from 'lucide-react';

export const DeletableEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent, id: string) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer children={
        <div
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
            }}
            className="nodrag nopan group"
        >
            <button
                className="w-5 h-5 bg-[#18181b] border border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-400 transition-all shadow-sm opacity-0 group-hover:opacity-100 peer-hover:opacity-100"
                onClick={(event) => onEdgeClick(event, id)}
                title="Delete Connection"
            >
                <X size={10} />
            </button>
        </div>
      } />
    </>
  );
};
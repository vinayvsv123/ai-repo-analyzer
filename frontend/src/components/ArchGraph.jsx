import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function ArchGraph({ data }) {
  const nodes = useMemo(() => {
    if (!data?.nodes) return [];
    
    const colors = {
      frontend: '#10b981', // emerald-500
      backend: '#3b82f6',  // blue-500
      database: '#f59e0b', // amber-500
      auth: '#ef4444',     // red-500
      socket: '#8b5cf6',   // violet-500
      default: '#64748b'   // slate-500
    };

    return data.nodes.map((node, i) => {
      // Basic layout engine (since we are not using dagre for simplicity, we'll try a nice circular/grid layout)
      const ringMap = { frontend: 0, backend: 1, auth: 1, socket: 1, database: 2 };
      const level = ringMap[node.group] ?? 1;
      
      const idxInLevel = data.nodes.filter(n => (ringMap[n.group]??1) === level).findIndex(n => n.id === node.id);
      const itemsInLevel = Math.max(1, data.nodes.filter(n => (ringMap[n.group]??1) === level).length);
      
      const width = 600;
      const xOffset = width / (itemsInLevel + 1);
      
      return {
        id: node.id,
        position: { x: xOffset * (idxInLevel + 1) - 50, y: level * 150 + 50 },
        data: { label: node.label },
        style: {
          background: colors[node.group] || colors.default,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          fontWeight: 'bold',
          width: 150,
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      };
    });
  }, [data]);

  const edges = useMemo(() => {
    if (!data?.edges) return [];
    return data.edges.map((edge, i) => ({
      id: `e-${edge.source}-${edge.target}-${i}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      labelStyle: { fill: '#cbd5e1', fontWeight: 500 },
      labelBgStyle: { fill: '#1e293b' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
      },
    }));
  }, [data]);

  if (!data?.nodes || data.nodes.length === 0) {
    return <div className="text-slate-400 p-8 text-center italic">Detailed Architecture Graph not available for this repository.</div>;
  }

  return (
    <div style={{ height: 400, width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView 
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls showInteractive={false} className="bg-slate-800 text-white fill-white border-slate-700" />
      </ReactFlow>
    </div>
  );
}

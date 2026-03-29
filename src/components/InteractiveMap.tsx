import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'city' | 'ruin' | 'landmark';
}

interface InteractiveMapProps {
  worldId: string;
  worldName: string;
}

export function InteractiveMap({ worldId, worldName }: InteractiveMapProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate some random nodes based on worldId for demonstration
  useEffect(() => {
    let seed = worldId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
      let x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const newNodes: Node[] = [];
    const types: ('city' | 'ruin' | 'landmark')[] = ['city', 'ruin', 'landmark'];
    for (let i = 0; i < 10; i++) {
      newNodes.push({
        id: `node-${i}`,
        x: random() * 800 + 100,
        y: random() * 400 + 100,
        name: `Ubicación ${i + 1}`,
        type: types[Math.floor(random() * types.length)],
      });
    }
    setNodes(newNodes);
  }, [worldId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="w-full h-[400px] bg-[#0a0a0c] border border-[#c6a052]/30 rounded-xl overflow-hidden relative group font-inter">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleZoomIn} className="p-2 bg-[#141419]/90 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-[#141419]/90 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleReset} className="p-2 bg-[#141419]/90 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-colors">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Map Canvas */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div 
          className="absolute inset-0 origin-center"
          style={{ 
            x: position.x, 
            y: position.y, 
            scale: scale,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(198, 160, 82, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        >
          {/* Connections (Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node, i) => {
              if (i === 0) return null;
              const prev = nodes[i - 1];
              return (
                <line 
                  key={`line-${i}`}
                  x1={prev.x} 
                  y1={prev.y} 
                  x2={node.x} 
                  y2={node.y} 
                  stroke="rgba(198, 160, 82, 0.2)" 
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div 
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node cursor-pointer"
              style={{ left: node.x, top: node.y }}
              onClick={(e) => {
                e.stopPropagation();
                alert(`Seleccionaste: ${node.name} (${node.type})`);
              }}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                node.type === 'city' ? 'bg-[#c6a052] border-[#0a0a0c]' :
                node.type === 'ruin' ? 'bg-transparent border-[#c6a052]' :
                'bg-[#7c3aed] border-[#0a0a0c]'
              } shadow-[0_0_10px_rgba(198,160,82,0.5)] group-hover/node:scale-150 transition-transform`}>
                {node.type === 'city' && <div className="w-1 h-1 bg-black rounded-full" />}
              </div>
              <span className="mt-2 text-[10px] font-bold text-[#c6a052] uppercase tracking-widest opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-[#0a0a0c]/80 px-2 py-1 rounded">
                {node.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#141419]/90 border border-[#c6a052]/20 p-3 rounded-lg flex gap-4 text-[10px] text-[#94a3b8] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#c6a052] border-2 border-[#0a0a0c]" /> Ciudad
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-transparent border-2 border-[#c6a052]" /> Ruina
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#7c3aed] border-2 border-[#0a0a0c]" /> Punto de Interés
        </div>
      </div>
    </div>
  );
}

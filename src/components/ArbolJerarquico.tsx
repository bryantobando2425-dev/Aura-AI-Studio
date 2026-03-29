import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, Map, MapPin, Building, Home, Plus, Trash2 } from 'lucide-react';
import { TreeNode } from '../schema-registry';
import { cn } from '../lib/utils';

interface ArbolJerarquicoProps {
  nodes: TreeNode[];
  onNodeSelect: (node: TreeNode) => void;
  selectedNodeId?: string;
  onAddNode: (parentId: string | null, type: TreeNode['type']) => void;
  onDeleteNode: (nodeId: string) => void;
}

const typeIcons = {
  region: <Map className="w-4 h-4" />,
  ciudad: <Building className="w-4 h-4" />,
  localizacion: <MapPin className="w-4 h-4" />,
  'sub-localizacion': <MapPin className="w-3 h-3" />,
  edificio: <Home className="w-4 h-4" />,
  habitacion: <Home className="w-3 h-3" />
};

export function ArbolJerarquico({ nodes, onNodeSelect, selectedNodeId, onAddNode, onDeleteNode }: ArbolJerarquicoProps) {
  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-[#c6a052] uppercase tracking-widest">Jerarquía</h4>
        <button 
          onClick={() => onAddNode(null, 'region')}
          className="p-1 hover:bg-[#c6a052]/20 rounded text-[#c6a052] transition-colors"
          title="Añadir Región"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {nodes.length === 0 ? (
        <p className="text-xs text-[#94a3b8] italic">No hay nodos. Añade una región para comenzar.</p>
      ) : (
        <div className="space-y-1">
          {nodes.map(node => (
            <TreeNodeItem 
              key={node.id} 
              node={node} 
              onSelect={onNodeSelect} 
              selectedId={selectedNodeId}
              onAdd={onAddNode}
              onDelete={onDeleteNode}
              level={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNodeItem({ 
  node, 
  onSelect, 
  selectedId, 
  onAdd, 
  onDelete,
  level 
}: { 
  node: TreeNode; 
  onSelect: (n: TreeNode) => void; 
  selectedId?: string;
  onAdd: (parentId: string, type: TreeNode['type']) => void;
  onDelete: (id: string) => void;
  level: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    // Determine next logical type
    let nextType: TreeNode['type'] = 'localizacion';
    if (node.type === 'region') nextType = 'ciudad';
    else if (node.type === 'ciudad') nextType = 'localizacion';
    else if (node.type === 'localizacion') nextType = 'sub-localizacion';
    else if (node.type === 'sub-localizacion') nextType = 'edificio';
    else if (node.type === 'edificio') nextType = 'habitacion';
    
    onAdd(node.id, nextType);
  };

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors group",
          isSelected ? "bg-[#c6a052]/20 text-white" : "hover:bg-white/5 text-[#e2e8f0]"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        <button 
          onClick={handleToggle}
          className={cn("p-0.5 rounded hover:bg-white/10 transition-colors", node.children.length === 0 ? "invisible" : "")}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        
        <span className={cn("text-[#c6a052]", isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100")}>
          {typeIcons[node.type]}
        </span>
        
        <span className="text-sm truncate flex-1">{node.name}</span>
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          {node.type !== 'habitacion' && (
            <button 
              onClick={handleAddChild}
              className="p-1 hover:bg-[#c6a052]/20 rounded text-[#c6a052] transition-colors"
              title="Añadir hijo"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <TreeNodeItem 
                key={child.id} 
                node={child} 
                onSelect={onSelect} 
                selectedId={selectedId}
                onAdd={onAdd}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

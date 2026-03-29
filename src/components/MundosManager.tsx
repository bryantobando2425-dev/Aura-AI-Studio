import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Star, Globe, BookOpen, Settings, ArrowLeft } from 'lucide-react';
import { Mundo, Faccion, COLLECTIONS, TreeNode } from '../schema-registry';
import { db, collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, FirebaseUser, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { MundosEditor } from './MundosEditor';
import { ArbolJerarquico } from './ArbolJerarquico';
import { WorldPortal } from './WorldPortal';
import { WorldDNAModal } from './WorldDNAModal';

interface MundosManagerProps {
  user: FirebaseUser;
  readMode: boolean;
  setReadMode: (v: boolean) => void;
  setBreadcrumb?: (b: string[]) => void;
  navigationTarget?: string;
  onNavigate?: (type: string, id: string) => void;
}

export function MundosManager({ user, readMode, setReadMode, setBreadcrumb, navigationTarget, onNavigate }: MundosManagerProps) {
  const [mundos, setMundos] = useState<Mundo[]>([]);
  const [selectedMundo, setSelectedMundo] = useState<Mundo | null>(null);
  const [editingWorld, setEditingWorld] = useState<Mundo | true | null>(null);
  const [facciones, setFacciones] = useState<Faccion[]>([]);
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    if (navigationTarget && mundos.length > 0) {
      const targetMundo = mundos.find(m => m.id === navigationTarget);
      if (targetMundo) {
        setSelectedMundo(targetMundo);
      }
    }
  }, [navigationTarget, mundos]);

  useEffect(() => {
    if (setBreadcrumb) {
      if (selectedMundo) {
        const breadcrumbs = ['Mundos', selectedMundo.name];
        if (selectedTreeNode) {
          breadcrumbs.push(selectedTreeNode.name);
        }
        setBreadcrumb(breadcrumbs);
      } else {
        setBreadcrumb(['Mundos']);
      }
    }
  }, [selectedMundo, selectedTreeNode, setBreadcrumb]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.MUNDOS), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedMundos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mundo));
      fetchedMundos.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
      setMundos(fetchedMundos);
    });
    return unsubscribe;
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.FACCIONES), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFacciones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faccion)));
    });
    return unsubscribe;
  }, [user.uid]);

  const handleUpdateMundo = (updatedMundo: Mundo) => {
    setSelectedMundo(updatedMundo);
  };

  const handleDeleteWorld = async (mundo: Mundo) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MUNDOS, mundo.id));
      if (selectedMundo?.id === mundo.id) {
        setSelectedMundo(null);
        setSelectedTreeNode(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.MUNDOS);
    }
  };

  const handleAddTreeNode = async (parentId: string | null, type: TreeNode['type']) => {
    if (!selectedMundo) return;
    
    const newNode: TreeNode = {
      id: `node-${Date.now()}`,
      name: `Nueva ${type}`,
      type,
      children: []
    };

    const newTreeNodes = JSON.parse(JSON.stringify(selectedMundo.treeNodes || []));

    if (parentId === null) {
      newTreeNodes.push(newNode);
    } else {
      const addChild = (nodes: TreeNode[]) => {
        for (let node of nodes) {
          if (node.id === parentId) {
            node.children.push(newNode);
            return true;
          }
          if (node.children.length > 0) {
            if (addChild(node.children)) return true;
          }
        }
        return false;
      };
      addChild(newTreeNodes);
    }

    const updatedMundo = { ...selectedMundo, treeNodes: newTreeNodes };
    setSelectedMundo(updatedMundo);
    await updateDoc(doc(db, COLLECTIONS.MUNDOS, selectedMundo.id), { treeNodes: newTreeNodes });
  };

  const handleDeleteTreeNode = async (nodeId: string) => {
    if (!selectedMundo) return;

    const newTreeNodes = JSON.parse(JSON.stringify(selectedMundo.treeNodes || []));

    const removeChild = (nodes: TreeNode[]) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === nodeId) {
          nodes.splice(i, 1);
          return true;
        }
        if (nodes[i].children.length > 0) {
          if (removeChild(nodes[i].children)) return true;
        }
      }
      return false;
    };
    removeChild(newTreeNodes);

    const updatedMundo = { ...selectedMundo, treeNodes: newTreeNodes };
    setSelectedMundo(updatedMundo);
    if (selectedTreeNode?.id === nodeId) setSelectedTreeNode(null);
    await updateDoc(doc(db, COLLECTIONS.MUNDOS, selectedMundo.id), { treeNodes: newTreeNodes });
  };

  return (
    <div className="h-full flex flex-col w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedMundo ? (
          <motion.div 
            key="portal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <WorldPortal 
              mundos={mundos} 
              onOpenWorld={(mundo) => setSelectedMundo(mundo)} 
              onCreateWorld={() => setEditingWorld(true)} 
              onEditWorld={(mundo) => setEditingWorld(mundo)}
              onDeleteWorld={handleDeleteWorld}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col bg-[#050505]"
          >
            {/* Dashboard Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#c6a052]/20 bg-[#0a0a0c]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setSelectedMundo(null); setSelectedTreeNode(null); }}
                  className="p-2 rounded hover:bg-white/5 text-[#94a3b8] hover:text-[#c6a052] transition-colors"
                  title="Volver al Portal"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-cinzel font-bold text-[#c6a052] tracking-widest uppercase">{selectedMundo.name}</h2>
                  <p className="text-xs text-[#94a3b8] font-mono uppercase tracking-wider">Dashboard de Control</p>
                </div>
              </div>
              
              {!readMode && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingWorld(selectedMundo)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#c6a052]/30 text-[#c6a052] font-cinzel text-xs uppercase tracking-widest rounded hover:bg-[#c6a052]/10 transition-colors"
                    title="ADN del Mundo"
                  >
                    <Settings className="w-4 h-4" />
                    ADN
                  </button>
                  <button 
                    onClick={() => setReadMode(!readMode)}
                    className={cn(
                      "p-2 rounded transition-all border",
                      readMode 
                        ? "bg-[#c6a052]/20 border-[#c6a052] text-[#c6a052]" 
                        : "bg-black/50 backdrop-blur-md border-[#c6a052]/30 hover:bg-[#c6a052]/20 hover:border-[#c6a052]/50 text-[#94a3b8]"
                    )}
                    title="Modo Lectura"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Árbol Jerárquico (Left Panel) */}
              {!readMode && (
                <div className="w-72 border-r border-[#c6a052]/20 p-4 flex flex-col bg-[#0a0a0c]">
                  <ArbolJerarquico 
                    nodes={selectedMundo.treeNodes || []} 
                    onNodeSelect={setSelectedTreeNode}
                    selectedNodeId={selectedTreeNode?.id}
                    onAddNode={handleAddTreeNode}
                    onDeleteNode={handleDeleteTreeNode}
                  />
                </div>
              )}

              {/* Editor Central (Right Panel) */}
              <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-[#050505]">
                {selectedTreeNode ? (
                  <div className="w-full h-full p-8">
                    <h2 className="text-3xl font-bold font-cinzel text-[#c6a052] mb-6">{selectedTreeNode.name}</h2>
                    <p className="text-[#94a3b8] italic">Editor de nodo en desarrollo (Pendiente de Prompt 2)...</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <MundosEditor 
                      mundo={selectedMundo} 
                      onUpdate={handleUpdateMundo} 
                      readMode={readMode} 
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingWorld && (
          <WorldDNAModal 
            user={user} 
            mundo={editingWorld !== true ? editingWorld : undefined}
            onClose={() => setEditingWorld(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

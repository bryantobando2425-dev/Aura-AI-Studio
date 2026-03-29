import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Plus, Zap, Cpu, Skull, Settings, Trash2, AlertTriangle } from 'lucide-react';
import { Mundo } from '../schema-registry';
import { cn } from '../lib/utils';

interface WorldPortalProps {
  mundos: Mundo[];
  onOpenWorld: (mundo: Mundo) => void;
  onCreateWorld: () => void;
  onEditWorld: (mundo: Mundo) => void;
  onDeleteWorld: (mundo: Mundo) => void;
}

export function WorldPortal({ mundos, onOpenWorld, onCreateWorld, onEditWorld, onDeleteWorld }: WorldPortalProps) {
  const [worldToDelete, setWorldToDelete] = useState<Mundo | null>(null);

  const handleDeleteConfirm = () => {
    if (worldToDelete) {
      onDeleteWorld(worldToDelete);
      setWorldToDelete(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full p-8 overflow-y-auto custom-scrollbar relative"
    >
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-cinzel font-bold text-[#c6a052] tracking-widest uppercase mb-2">Portal de Mundos</h1>
          <p className="text-[#94a3b8] font-sans">Selecciona un nexo para acceder a su sala de control o inicializa uno nuevo.</p>
        </div>
        <button
          onClick={onCreateWorld}
          className="flex items-center gap-2 px-6 py-3 bg-[#c6a052] text-black font-cinzel font-bold text-sm tracking-widest uppercase rounded hover:bg-[#d4af37] transition-all shadow-[0_0_15px_rgba(198,160,82,0.3)] hover:shadow-[0_0_25px_rgba(198,160,82,0.5)]"
        >
          <Plus className="w-5 h-5" />
          Registro de Nuevo Mundo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mundos.map((mundo, index) => (
          <motion.div
            key={mundo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-[#0a0a0c] border border-[#c6a052]/20 rounded-xl overflow-hidden hover:border-[#c6a052]/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(198,160,82,0.15)] flex flex-col h-80"
          >
            {/* Background Image or Gradient */}
            <div className="absolute inset-0 z-0">
              {mundo.imageUrl ? (
                <div 
                  className="w-full h-full bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-500"
                  style={{ backgroundImage: `url(${mundo.imageUrl})` }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a24] to-[#0a0a0c] opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent" />
            </div>

            {/* Top Actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); setWorldToDelete(mundo); }}
                className="p-2 bg-black/50 hover:bg-red-500/20 border border-red-500/30 rounded text-red-500 transition-colors backdrop-blur-sm"
                title="Purgar Nexo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col h-full">
              <div className="flex-1 mt-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-2xl font-cinzel font-bold text-[#c6a052] line-clamp-2">{mundo.name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditWorld(mundo); }}
                    className="p-1.5 mt-0.5 bg-black/50 hover:bg-[#c6a052]/20 border border-[#c6a052]/30 rounded text-[#c6a052] transition-colors backdrop-blur-sm shrink-0 opacity-0 group-hover:opacity-100"
                    title="Configuración de ADN"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-[#94a3b8] line-clamp-3 font-sans leading-relaxed">
                  {mundo.description || "Sin descripción registrada en el nexo."}
                </p>
              </div>

              {/* Stats / Icons */}
              <div className="flex items-center gap-4 py-4 border-t border-[#c6a052]/20 mt-4">
                <div className="flex items-center gap-1.5" title="Nivel de Magia">
                  <Zap className={cn("w-4 h-4", mundo.magicActive !== false ? "text-[#c6a052]" : "text-[#94a3b8]/30")} />
                  <span className="text-xs font-mono text-[#e2e8f0]">{mundo.magicActive !== false ? `${mundo.magicLevel || 0}%` : 'Off'}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Nivel Tecnológico">
                  <Cpu className={cn("w-4 h-4", mundo.techActive !== false ? "text-[#c6a052]" : "text-[#94a3b8]/30")} />
                  <span className="text-xs font-mono text-[#e2e8f0]">{mundo.techActive !== false ? `${mundo.techLevel || 0}%` : 'Off'}</span>
                </div>
                <div className="flex items-center gap-1.5" title="Mortalidad Biológica">
                  <Skull className={cn("w-4 h-4", mundo.biologicalMortality !== false ? "text-[#c6a052]" : "text-[#94a3b8]/30")} />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenWorld(mundo)}
                className="w-full py-3 bg-transparent border border-[#c6a052] text-[#c6a052] font-cinzel font-bold text-sm tracking-widest uppercase rounded group-hover:bg-[#c6a052] group-hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Abrir Nexo
              </button>
            </div>
          </motion.div>
        ))}

        {mundos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#c6a052]/30 rounded-xl bg-[#0a0a0c]/50">
            <Globe className="w-16 h-16 text-[#c6a052]/30 mb-4" />
            <h3 className="text-xl font-cinzel text-[#c6a052] mb-2">El Vacío Primordial</h3>
            <p className="text-[#94a3b8] max-w-md">No hay mundos registrados en este nexo. Inicia la creación de un nuevo mundo para comenzar.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {worldToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0c] border border-red-500/50 rounded-lg max-w-md w-full p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-cinzel font-bold text-red-500 uppercase tracking-widest">Purgar Nexo</h3>
              </div>
              <p className="text-[#94a3b8] mb-6 font-sans">
                ¿Deseas purgar este Nexo? Esta acción es irreversible y destruirá toda la información contenida en <strong>{worldToDelete.name}</strong>.
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setWorldToDelete(null)}
                  className="px-4 py-2 border border-[#c6a052]/50 text-[#c6a052] font-cinzel text-sm uppercase tracking-widest rounded hover:bg-[#c6a052]/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-500/20 border border-red-500 text-red-500 font-cinzel font-bold text-sm uppercase tracking-widest rounded hover:bg-red-500 hover:text-white transition-colors"
                >
                  Purgar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

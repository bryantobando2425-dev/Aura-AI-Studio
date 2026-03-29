import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Save, X, Settings2, Globe, Shield, Zap, Skull, Info, AlertTriangle, BookOpen } from 'lucide-react';
import { db, collection, addDoc, updateDoc, doc, serverTimestamp, OperationType, handleFirestoreError, FirebaseUser } from '../lib/firebase';
import { COLLECTIONS, Mundo } from '../schema-registry';
import { cn } from '../lib/utils';
import { TimelineScroller } from './TimelineScroller';
import { TechHitoSelector } from './TechHitoSelector';
import { ArchivistaDrawer, ArchivistaTopic } from './ArchivistaDrawer';

interface WorldDNAModalProps {
  user: FirebaseUser;
  mundo?: Mundo;
  onClose: () => void;
}

export function WorldDNAModal({ user, mundo, onClose }: WorldDNAModalProps) {
  const [name, setName] = useState(mundo?.name || '');
  const [description, setDescription] = useState(mundo?.description || '');
  
  // Nexo (ADN del Mundo)
  const [magicActive, setMagicActive] = useState(mundo?.magicActive ?? true);
  const [techActive, setTechActive] = useState(mundo?.techActive ?? true);
  const [biologicalMortality, setBiologicalMortality] = useState(mundo?.biologicalMortality ?? true);
  
  const [gravity, setGravity] = useState(mundo?.gravity ?? 1.0);
  const [magicLevel, setMagicLevel] = useState(mundo?.magicLevel ?? 50);
  const [techLevel, setTechLevel] = useState(mundo?.techLevel ?? 50);
  const [startYear, setStartYear] = useState(mundo?.startYear ?? 0);

  const [saving, setSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [syncTechWithEra, setSyncTechWithEra] = useState(!mundo);
  const [drawerContent, setDrawerContent] = useState<ArchivistaTopic>(null);

  // Sync tech level with era if enabled
  useEffect(() => {
    if (syncTechWithEra) {
      if (startYear < -3000) setTechLevel(10);
      else if (startYear < 500) setTechLevel(20);
      else if (startYear < 1500) setTechLevel(30);
      else if (startYear < 1900) setTechLevel(50);
      else if (startYear < 1950) setTechLevel(70);
      else if (startYear < 2050) setTechLevel(80);
      else if (startYear < 3000) setTechLevel(90);
      else setTechLevel(100);
    }
  }, [startYear, syncTechWithEra]);

  const hasUnsavedChanges = 
    name !== (mundo?.name || '') || 
    description !== (mundo?.description || '') || 
    gravity !== (mundo?.gravity ?? 1.0) || 
    magicLevel !== (mundo?.magicLevel ?? 50) || 
    techLevel !== (mundo?.techLevel ?? 50) || 
    startYear !== (mundo?.startYear ?? 0) ||
    magicActive !== (mundo?.magicActive ?? true) ||
    techActive !== (mundo?.techActive ?? true) ||
    biologicalMortality !== (mundo?.biologicalMortality ?? true);

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const mundoData = {
        name,
        description,
        magicActive,
        techActive,
        biologicalMortality,
        gravity,
        magicLevel: magicActive ? magicLevel : 0,
        techLevel: techActive ? techLevel : 0,
        startYear,
        updatedAt: serverTimestamp(),
      };

      if (mundo) {
        await updateDoc(doc(db, COLLECTIONS.MUNDOS, mundo.id), mundoData);
      } else {
        await addDoc(collection(db, COLLECTIONS.MUNDOS), {
          ...mundoData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, mundo ? OperationType.UPDATE : OperationType.CREATE, COLLECTIONS.MUNDOS);
    } finally {
      setSaving(false);
    }
  };

  const handleSuggest = (field: string) => {
    // Hook for AI Suggestion
    console.log(`AI Suggestion requested for ${field}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#000000]/90 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#000000] border-[#c6a052] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_30px_rgba(198,160,82,0.15)]"
        style={{ borderWidth: '0.5px' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#c6a052]/30">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-[#c6a052]" />
            <h2 className="text-lg font-cinzel font-bold text-[#c6a052] tracking-widest uppercase">
              Registro de Nuevo Mundo: Sala de Control
            </h2>
          </div>
          <button onClick={handleCloseAttempt} className="p-1.5 rounded hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-[#94a3b8]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Identificación Básica */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-cinzel text-[#c6a052] mb-1 uppercase tracking-widest">Designación del Mundo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Etherea, Neo-Tokyo, Arrakis..."
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-1 text-lg text-[#e2e8f0] font-cinzel focus:outline-none focus:border-[#c6a052] transition-colors placeholder:text-[#94a3b8]/30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-cinzel text-[#c6a052] mb-1 uppercase tracking-widest flex items-center gap-2">
                Resumen Ejecutivo
                <button onClick={() => handleSuggest('description')} className="text-[#c6a052]/50 hover:text-[#c6a052] transition-colors">
                  <Sparkles className="w-3 h-3" />
                </button>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente la esencia de este mundo..."
                rows={2}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-1 text-sm text-[#e2e8f0] font-sans focus:outline-none focus:border-[#c6a052] transition-colors resize-none placeholder:text-[#94a3b8]/30"
              />
            </div>
          </div>

          {/* Interruptores de Realidad */}
          <div className="space-y-3">
            <h3 className="text-xs font-cinzel text-[#c6a052] uppercase tracking-widest border-b border-[#c6a052]/20 pb-1">Interruptores de Realidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 border border-[#c6a052]/20 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <Zap className={cn("w-4 h-4", magicActive ? "text-[#c6a052]" : "text-[#94a3b8]/50")} />
                  <span className="text-xs font-cinzel text-[#e2e8f0]">Magia Activa</span>
                </div>
                <button 
                  onClick={() => setMagicActive(!magicActive)}
                  className={cn("w-10 h-5 rounded-full transition-colors relative", magicActive ? "bg-[#c6a052]" : "bg-[#333]")}
                >
                  <motion.div 
                    className="w-3 h-3 bg-black rounded-full absolute top-1"
                    animate={{ left: magicActive ? '22px' : '4px' }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border border-[#c6a052]/20 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <Globe className={cn("w-4 h-4", techActive ? "text-[#c6a052]" : "text-[#94a3b8]/50")} />
                  <span className="text-xs font-cinzel text-[#e2e8f0]">Tecnología</span>
                </div>
                <button 
                  onClick={() => setTechActive(!techActive)}
                  className={cn("w-10 h-5 rounded-full transition-colors relative", techActive ? "bg-[#c6a052]" : "bg-[#333]")}
                >
                  <motion.div 
                    className="w-3 h-3 bg-black rounded-full absolute top-1"
                    animate={{ left: techActive ? '22px' : '4px' }}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border border-[#c6a052]/20 rounded bg-white/5">
                <div className="flex items-center gap-2">
                  <Skull className={cn("w-4 h-4", biologicalMortality ? "text-[#c6a052]" : "text-[#94a3b8]/50")} />
                  <span className="text-xs font-cinzel text-[#e2e8f0]">Mortalidad</span>
                </div>
                <button 
                  onClick={() => setBiologicalMortality(!biologicalMortality)}
                  className={cn("w-10 h-5 rounded-full transition-colors relative", biologicalMortality ? "bg-[#c6a052]" : "bg-[#333]")}
                >
                  <motion.div 
                    className="w-3 h-3 bg-black rounded-full absolute top-1"
                    animate={{ left: biologicalMortality ? '22px' : '4px' }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sliders de Precisión */}
          <div className="space-y-4">
            <h3 className="text-xs font-cinzel text-[#c6a052] uppercase tracking-widest border-b border-[#c6a052]/20 pb-1">Parámetros Físicos y Metafísicos</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-cinzel text-[#e2e8f0] uppercase tracking-widest flex items-center gap-2">
                  Gravedad Base
                  <button onClick={() => handleSuggest('gravity')} className="text-[#c6a052]/50 hover:text-[#c6a052] transition-colors">
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDrawerContent('gravity')} className="text-[#94a3b8] hover:text-[#c6a052] transition-colors">
                    <Info className="w-3 h-3" />
                  </button>
                </label>
                <span className="text-sm font-mono text-[#c6a052]">{gravity.toFixed(1)}g</span>
              </div>
              <input 
                type="range" 
                min="0.1" max="5.0" step="0.1" 
                value={gravity} 
                onChange={(e) => setGravity(parseFloat(e.target.value))}
                className="w-full accent-[#c6a052]"
              />
            </div>

            <div className={cn("space-y-3 transition-opacity", !magicActive && "opacity-30 pointer-events-none")}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-cinzel text-[#e2e8f0] uppercase tracking-widest flex items-center gap-2">
                  Nivel de Magia
                  <button onClick={() => handleSuggest('magicLevel')} className="text-[#c6a052]/50 hover:text-[#c6a052] transition-colors">
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDrawerContent('magic')} className="text-[#94a3b8] hover:text-[#c6a052] transition-colors">
                    <Info className="w-3 h-3" />
                  </button>
                </label>
                <span className="text-sm font-mono text-[#c6a052]">{magicLevel}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" step="1" 
                value={magicLevel} 
                onChange={(e) => setMagicLevel(parseInt(e.target.value))}
                className="w-full accent-[#c6a052]"
              />
            </div>

            <div className={cn("space-y-3 transition-opacity", !techActive && "opacity-30 pointer-events-none")}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-cinzel text-[#e2e8f0] uppercase tracking-widest flex items-center gap-2">
                  Nivel Tecnológico
                  <button onClick={() => handleSuggest('techLevel')} className="text-[#c6a052]/50 hover:text-[#c6a052] transition-colors">
                    <Sparkles className="w-3 h-3" />
                  </button>
                  <button onClick={() => setDrawerContent('tech')} className="text-[#94a3b8] hover:text-[#c6a052] transition-colors">
                    <Info className="w-3 h-3" />
                  </button>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#94a3b8] uppercase tracking-widest">Sincronizar con Era</span>
                  <button 
                    onClick={() => setSyncTechWithEra(!syncTechWithEra)}
                    className={cn("w-8 h-4 rounded-full transition-colors relative", syncTechWithEra ? "bg-[#c6a052]" : "bg-[#333]")}
                  >
                    <motion.div 
                      className="w-3 h-3 bg-black rounded-full absolute top-0.5"
                      animate={{ left: syncTechWithEra ? '18px' : '2px' }}
                    />
                  </button>
                </div>
              </div>
              
              <div className="relative w-full overflow-hidden mt-2">
                <TechHitoSelector 
                  value={techLevel} 
                  onChange={(v) => {
                    setTechLevel(v);
                    setSyncTechWithEra(false);
                  }} 
                  disabled={!techActive} 
                />
              </div>
            </div>
          </div>

          {/* Timeline Scroller */}
          <div className="pt-3 border-t border-[#c6a052]/20">
            <TimelineScroller 
              startYear={startYear} 
              onChange={setStartYear} 
              onSuggest={() => handleSuggest('startYear')}
            />
          </div>

        </div>

        <div className="sticky bottom-0 p-4 border-t border-[#c6a052]/30 bg-[#050505]/80 backdrop-blur-md flex justify-end gap-3 z-10">
          <button
            onClick={handleCloseAttempt}
            className="px-4 py-1.5 border border-[#c6a052]/50 text-[#c6a052] font-cinzel text-xs uppercase tracking-widest rounded hover:bg-[#c6a052]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-6 py-1.5 bg-[#c6a052] text-black font-cinzel font-bold text-xs uppercase tracking-widest rounded hover:bg-[#d4af37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mundo ? 'Guardar Cambios' : 'Inicializar Nexo'}
          </button>
        </div>
      </motion.div>

      <ArchivistaDrawer topic={drawerContent} onClose={() => setDrawerContent(null)} />

      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0c] border border-[#c6a052]/50 rounded-lg max-w-md w-full p-6 shadow-[0_0_30px_rgba(198,160,82,0.15)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-[#c6a052]" />
                <h3 className="text-xl font-cinzel font-bold text-[#c6a052] uppercase tracking-widest">Protocolo de Cierre</h3>
              </div>
              <p className="text-[#94a3b8] mb-6 font-sans">
                Se ha detectado ADN de mundo sin inicializar. Si cierras la sala de control ahora, los datos configurados se perderán en el vacío. ¿Deseas continuar?
              </p>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 border border-[#c6a052]/50 text-[#c6a052] font-cinzel text-sm uppercase tracking-widest rounded hover:bg-[#c6a052]/10 transition-colors"
                >
                  Permanecer
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-[#c6a052] text-black font-cinzel font-bold text-sm uppercase tracking-widest rounded hover:bg-[#d4af37] transition-colors"
                >
                  Descartar ADN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

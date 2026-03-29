import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, FileText } from 'lucide-react';

export function RightSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedNotes = localStorage.getItem('aura_global_notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('aura_global_notes', notes);
    // Optional: Add a toast notification here
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-80 glass-panel border-l border-[#7c3aed]/20 flex flex-col z-40 fixed right-0 top-0 bottom-0 bg-[#0a0a0c]/95 backdrop-blur-xl"
        >
          <div className="p-6 border-b border-[#7c3aed]/10 flex justify-between items-center">
            <h3 className="text-lg font-bold font-cinzel text-glow-gold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bloc de Notas
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-[#7c3aed]/20 rounded-lg transition-all text-[#94a3b8] hover:text-[#7c3aed]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe tus notas aquí... (Se guardan localmente)"
              className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-[#e2e8f0] placeholder:text-[#94a3b8]/50 custom-scrollbar"
            />
          </div>
          <div className="p-4 border-t border-[#7c3aed]/10 flex justify-end">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Save className="w-4 h-4" />
              Guardar Notas
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

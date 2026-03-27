import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Globe, Users, BookOpen, Map, Shield } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseUser } from '../lib/firebase';
import { COLLECTIONS } from '../schema-registry';
import { cn } from '../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser;
  onNavigate: (view: string, id?: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  collection: string;
  description?: string;
}

export function GlobalSearchModal({ isOpen, onClose, user, onNavigate }: GlobalSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // The toggle logic is handled in App.tsx, but we can prevent default here
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const term = searchTerm.toLowerCase();
        const searchResults: SearchResult[] = [];

        // Search in Mundos
        const mundosSnap = await getDocs(query(collection(db, COLLECTIONS.MUNDOS), where('userId', '==', user.uid)));
        mundosSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(term) || data.description?.toLowerCase().includes(term)) {
            searchResults.push({ id: doc.id, name: data.name, type: 'Mundo', collection: 'mundos', description: data.description });
          }
        });

        // Search in Personajes
        const personajesSnap = await getDocs(query(collection(db, COLLECTIONS.PERSONAJES), where('userId', '==', user.uid)));
        personajesSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(term) || data.bio?.toLowerCase().includes(term)) {
            searchResults.push({ id: doc.id, name: data.name, type: 'Personaje', collection: 'personajes', description: data.bio });
          }
        });

        // Search in Bestiario
        const bestiarioSnap = await getDocs(query(collection(db, COLLECTIONS.BESTIARIO), where('userId', '==', user.uid)));
        bestiarioSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(term) || data.description?.toLowerCase().includes(term)) {
            searchResults.push({ id: doc.id, name: data.name, type: 'Criatura', collection: 'bestiario', description: data.description });
          }
        });

        // Search in Facciones
        const faccionesSnap = await getDocs(query(collection(db, COLLECTIONS.FACCIONES), where('userId', '==', user.uid)));
        faccionesSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(term) || data.description?.toLowerCase().includes(term)) {
            searchResults.push({ id: doc.id, name: data.name, type: 'Facción', collection: 'facciones', description: data.description });
          }
        });

        // Search in Objetos
        const objetosSnap = await getDocs(query(collection(db, COLLECTIONS.OBJETOS), where('userId', '==', user.uid)));
        objetosSnap.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(term) || data.description?.toLowerCase().includes(term)) {
            searchResults.push({ id: doc.id, name: data.name, type: 'Objeto', collection: 'objetos', description: data.description });
          }
        });

        setResults(searchResults);
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, user.uid]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Mundo': return <Globe className="w-4 h-4 text-[#c6a052]" />;
      case 'Personaje': return <Users className="w-4 h-4 text-[#7c3aed]" />;
      case 'Criatura': return <Shield className="w-4 h-4 text-red-400" />;
      case 'Facción': return <Map className="w-4 h-4 text-blue-400" />;
      case 'Objeto': return <BookOpen className="w-4 h-4 text-green-400" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 bg-[#0a0a0c]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-[#0a0a0a] border border-[#7c3aed]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center px-4 py-4 border-b border-[#7c3aed]/20 bg-white/5">
            <Search className="w-5 h-5 text-[#c6a052] mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar mundos, personajes, facciones... (Ctrl+K)"
              className="flex-1 bg-transparent border-none outline-none text-[#e2e8f0] text-lg placeholder:text-[#94a3b8]/50"
            />
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#94a3b8] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="p-8 text-center text-[#94a3b8] flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-[#c6a052] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm tracking-widest uppercase">Buscando en el Nexo...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.collection}-${result.id}`}
                    onClick={() => {
                      onNavigate(result.collection, result.id);
                      onClose();
                    }}
                    className="w-full flex items-start gap-4 p-4 hover:bg-white/5 rounded-xl transition-all text-left group"
                  >
                    <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/5 group-hover:border-[#7c3aed]/30 transition-colors">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[#e2e8f0] font-medium truncate group-hover:text-[#c6a052] transition-colors">{result.name}</h4>
                        <span className="text-[10px] uppercase tracking-widest text-[#94a3b8] bg-white/5 px-2 py-1 rounded border border-white/5">
                          {result.type}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-[#94a3b8] line-clamp-1">{result.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-8 text-center text-[#94a3b8]">
                <p>No se encontraron resultados para "{searchTerm}"</p>
              </div>
            ) : (
              <div className="p-8 text-center text-[#94a3b8]/50">
                <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 border-t border-[#7c3aed]/20 bg-black/40 flex justify-between items-center text-[10px] text-[#94a3b8] uppercase tracking-widest">
            <span>Navegación Rápida</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd> Navegar</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd> Seleccionar</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> Cerrar</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

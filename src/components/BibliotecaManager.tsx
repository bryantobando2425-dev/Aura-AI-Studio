import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Star, Users, Shield, Sword, BookOpen, User as UserIcon, Library } from 'lucide-react';
import { COLLECTIONS } from '../schema-registry';
import { db, collection, query, where, onSnapshot, orderBy, doc, updateDoc, FirebaseUser } from '../lib/firebase';
import { cn } from '../lib/utils';
import { DetalleEntidadModal, CrearEntidadModal, EditarEntidadModal } from './EntidadModals';

export function BibliotecaManager({ user, onNavigate, readMode, setReadMode, setBreadcrumb, navigationTarget }: { user: FirebaseUser, onNavigate?: (type: string, id: string) => void, readMode: boolean, setReadMode: (v: boolean) => void, setBreadcrumb?: (b: string[]) => void, navigationTarget?: { view: string, id?: string } | null }) {
  const [activeTab, setActiveTab] = useState<'personajes' | 'bestiario' | 'facciones' | 'objetos'>('personajes');
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (navigationTarget?.view && ['personajes', 'bestiario', 'facciones', 'objetos'].includes(navigationTarget.view)) {
      setActiveTab(navigationTarget.view as any);
    }
  }, [navigationTarget?.view]);

  useEffect(() => {
    if (navigationTarget?.id && items.length > 0) {
      const targetItem = items.find(i => i.id === navigationTarget.id);
      if (targetItem) {
        setSelectedItem(targetItem);
        setShowDetail(true);
      }
    }
  }, [navigationTarget?.id, items]);

  const toggleFavorite = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    let collectionName = '';
    switch (activeTab) {
      case 'personajes': collectionName = COLLECTIONS.PERSONAJES; break;
      case 'bestiario': collectionName = COLLECTIONS.BESTIARIO; break;
      case 'facciones': collectionName = COLLECTIONS.FACCIONES; break;
      case 'objetos': collectionName = COLLECTIONS.OBJETOS; break;
    }
    
    // Check limit of 15 favorites
    if (!item.isFavorite) {
      const favoritesCount = items.filter(i => i.isFavorite).length;
      if (favoritesCount >= 15) {
        alert("Límite de 15 favoritos alcanzado en esta sección.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, collectionName, item.id), {
        isFavorite: !item.isFavorite
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    if (setBreadcrumb) {
      if (selectedItem) {
        setBreadcrumb([activeTab.charAt(0).toUpperCase() + activeTab.slice(1), selectedItem.name]);
      } else {
        setBreadcrumb([activeTab.charAt(0).toUpperCase() + activeTab.slice(1)]);
      }
    }
  }, [activeTab, selectedItem, setBreadcrumb]);

  useEffect(() => {
    let collectionName = '';
    switch (activeTab) {
      case 'personajes': collectionName = COLLECTIONS.PERSONAJES; break;
      case 'bestiario': collectionName = COLLECTIONS.BESTIARIO; break;
      case 'facciones': collectionName = COLLECTIONS.FACCIONES; break;
      case 'objetos': collectionName = COLLECTIONS.OBJETOS; break;
    }
    
    const q = query(collection(db, collectionName), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort so favorites are pinned to the top
      fetchedItems.sort((a: any, b: any) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
      setItems(fetchedItems);
    });
    return unsubscribe;
  }, [user.uid, activeTab]);

  return (
    <div className="h-full flex flex-col max-w-[1200px] mx-auto w-full">
      {!readMode && (
        <>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-8 mb-10">
            <div>
              <h3 className="text-4xl font-bold serif-text text-glow-gold mb-2">Biblioteca</h3>
              <p className="text-[#94a3b8]">Archivo de expedientes y registros del multiverso.</p>
            </div>
            <button 
              onClick={() => setShowCreate(true)}
              className="btn-primary flex items-center justify-center gap-3 w-full md:w-auto"
            >
              <Plus className="w-5 h-5" />
              Crear Entidad
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#c6a052]/20 pb-4">
            <div className="flex gap-4 overflow-x-auto custom-scrollbar flex-1">
              {(['personajes', 'bestiario', 'facciones', 'objetos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedItem(null); setShowDetail(false); }}
                  className={cn(
                    "px-6 py-2 rounded-full font-medium uppercase tracking-widest text-xs transition-all whitespace-nowrap",
                    activeTab === tab 
                      ? "bg-[#c6a052]/10 text-[#c6a052] border border-[#c6a052]/30" 
                      : "bg-transparent text-[#94a3b8] hover:text-[#e2e8f0] border border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder={`Buscar en ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] focus:border-[#7c3aed] outline-none transition-all"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-10 pr-2 pt-6">
        {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
          <div 
            key={item.id} 
            className="relative bg-[#1a1a1a] border-[0.5px] border-[#c6a052]/30 rounded-b-xl rounded-tr-xl p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(198,160,82,0.1)] hover:border-[#c6a052]/60 hover:brightness-110"
            onClick={() => { setSelectedItem(item); setShowDetail(true); }}
          >
            {/* Pestaña de Carpeta */}
            <div className="absolute -top-6 left-[-0.5px] bg-[#1a1a1a] border-t-[0.5px] border-l-[0.5px] border-r-[0.5px] border-[#c6a052]/30 px-4 py-1 rounded-t-lg text-[10px] font-mono text-[#c6a052] uppercase tracking-widest group-hover:border-[#c6a052]/60 transition-colors">
              ENT-{item.id.slice(0,4)}
            </div>
            
            <button 
              onClick={(e) => toggleFavorite(e, item)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-all z-10"
            >
              <Star className={cn("w-5 h-5 transition-colors", item.isFavorite ? "text-[#c6a052] fill-[#c6a052]" : "text-[#94a3b8]")} />
            </button>

            {activeTab === 'personajes' && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded bg-black/50 border border-white/5 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-[#94a3b8]" />
                    )}
                  </div>
                  <span className="px-2 py-1 bg-black/50 rounded text-[10px] uppercase tracking-wider text-[#94a3b8] border border-white/5">
                    {item.class || 'Desconocido'}
                  </span>
                </div>
                
                <h4 className="text-xl font-bold serif-text text-[#e2e8f0] mb-2 group-hover:text-glow-gold transition-colors line-clamp-1">{item.name}</h4>
                <p className="text-xs text-[#7c3aed] font-medium uppercase tracking-widest mb-2">{item.race || 'Entidad'}</p>
                <p className="text-sm text-[#94a3b8] line-clamp-3 leading-relaxed italic">"{item.bio}"</p>
              </>
            )}
            {activeTab !== 'personajes' && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold serif-text text-[#e2e8f0] group-hover:text-glow-gold transition-colors line-clamp-1">{item.name}</h4>
                </div>
                <p className="text-xs text-[#7c3aed] font-medium mb-3 uppercase tracking-widest">
                  {activeTab === 'bestiario' ? `Peligro: ${item.dangerLevel || '?'}` : 
                   activeTab === 'facciones' ? `Influencia: ${item.influence || '?'}` : 
                   `Tipo: ${item.type || '?'}`}
                </p>
                <p className="text-sm text-[#94a3b8] line-clamp-4 leading-relaxed">{item.description}</p>
              </>
            )}
          </div>
        ))}
        {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="col-span-full py-24 text-center border border-dashed border-[#c6a052]/30 rounded-xl opacity-50 mt-6">
            <Library className="w-16 h-16 text-[#c6a052]/40 mx-auto mb-6" />
            <p className="text-[#94a3b8] text-lg italic">No hay registros encontrados.</p>
          </div>
        )}
      </div>

      {showCreate && <CrearEntidadModal user={user} activeTab={activeTab} onClose={() => setShowCreate(false)} />}
      
      {showDetail && selectedItem && (
        <DetalleEntidadModal 
          item={selectedItem} 
          type={activeTab} 
          onClose={() => setShowDetail(false)} 
          onEdit={() => { setShowDetail(false); setShowEdit(true); }}
          onNavigate={onNavigate}
          readMode={readMode}
          setReadMode={setReadMode}
        />
      )}

      {showEdit && selectedItem && (
        <EditarEntidadModal 
          item={selectedItem} 
          type={activeTab} 
          onClose={() => setShowEdit(false)} 
        />
      )}
    </div>
  );
}

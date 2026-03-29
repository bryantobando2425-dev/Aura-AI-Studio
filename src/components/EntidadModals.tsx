import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Edit, Trash2, Save, Loader2, Sparkles, BookOpen, Globe, Map, Users, Shield, FileText } from 'lucide-react';
import { COLLECTIONS } from '../schema-registry';
import { db, doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, OperationType, handleFirestoreError, FirebaseUser, setDoc } from '../lib/firebase';
import { ai, MODELS } from '../lib/gemini';
import Markdown from 'react-markdown';
import { cn, compressImage } from '../lib/utils';
import { ModoLectura } from './ModoLectura';

export function DetalleEntidadModal({ item, type, onClose, onEdit, onNavigate, readMode, setReadMode }: { item: any, type: string, onClose: () => void, onEdit: () => void, onNavigate?: (type: string, id: string) => void, readMode?: boolean, setReadMode?: (v: boolean) => void }) {
  if (readMode) {
    return (
      <ModoLectura
        title={item.name}
        image={item.imageUrl}
        content={
          <>
            <p className="lead">{item.bio || item.description}</p>
            {/* Additional content could go here */}
          </>
        }
        onClose={() => setReadMode?.(false)}
      />
    );
  }

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const regex = /entity:([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const type = match[1];
      const id = match[2];
      parts.push(
        <button
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(type, id);
          }}
          className="text-[#c6a052] hover:text-[#7c3aed] underline decoration-[#c6a052]/30 hover:decoration-[#7c3aed] transition-colors font-medium px-1 rounded hover:bg-[#7c3aed]/10"
          title={`Ver ${type}`}
        >
          [{type}:{id.slice(0, 4)}]
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/95 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="aura-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-[#7c3aed]/30"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="flex flex-col md:flex-row gap-10">
            {type === 'personajes' && item.imageUrl && (
              <div className="w-full md:w-72 shrink-0">
                <img src={item.imageUrl} className="w-full aspect-[4/5] object-cover rounded-2xl border border-[#7c3aed]/20 shadow-[0_0_30px_rgba(124,58,237,0.2)]" referrerPolicy="no-referrer" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-bold serif-text text-glow-gold mb-2">{item.name}</h3>
                  <p className="text-[#7c3aed] font-medium uppercase tracking-[0.3em] text-xs">
                    {type === 'personajes' ? `${item.race} · ${item.class}` : 
                     type === 'bestiario' ? `Criatura · Peligro ${item.dangerLevel}` :
                     type === 'facciones' ? `Facción · Influencia ${item.influence}` :
                     `Objeto · Tipo ${item.type}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setReadMode?.(true)}
                    className="p-2 hover:bg-white/5 rounded-full transition-all text-[#94a3b8] hover:text-[#7c3aed]"
                    title="Modo Lectura"
                  >
                    <BookOpen className="w-6 h-6" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-[#94a3b8]">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-4 border-b border-[#7c3aed]/10 pb-2">Descripción / Bio</h4>
                  <p className="text-[#e2e8f0] leading-relaxed italic whitespace-pre-wrap">
                    {renderTextWithLinks(item.bio || item.description)}
                  </p>
                </section>

                <section className="aura-card p-6 bg-white/5 border-[#c6a052]/20">
                  <h4 className="text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Presencia en el Multiverso
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Mundo de Origen</p>
                      {item.worldId ? (
                        <button 
                          onClick={() => onNavigate?.('mundos', item.worldId)}
                          className="text-sm font-bold text-[#7c3aed] hover:underline flex items-center gap-2"
                        >
                          <Map className="w-3 h-3" />
                          {item.worldId.slice(0,12)}...
                        </button>
                      ) : (
                        <p className="text-sm font-bold text-[#94a3b8]">Entidad Libre (Sin Mundo)</p>
                      )}
                    </div>
                    
                    {(item.padreId || item.aliadoId) && (
                      <>
                        {item.padreId && (
                          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Padre / Creador</p>
                            <button 
                              onClick={() => onNavigate?.('personajes', item.padreId)}
                              className="text-sm font-bold text-[#c6a052] hover:underline flex items-center gap-2"
                            >
                              <Users className="w-3 h-3" />
                              {item.padreId.slice(0,12)}...
                            </button>
                          </div>
                        )}
                        {item.aliadoId && (
                          <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                            <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Aliado Principal</p>
                            <button 
                              onClick={() => onNavigate?.('personajes', item.aliadoId)}
                              className="text-sm font-bold text-[#c6a052] hover:underline flex items-center gap-2"
                            >
                              <Shield className="w-3 h-3" />
                              {item.aliadoId.slice(0,12)}...
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                      <p className="text-[10px] text-[#94a3b8] uppercase mb-1">Estado Actual</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'Muerto' || item.status === 'Destruido' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                        <p className="text-sm font-bold text-[#e2e8f0]">{item.status || 'Activo / Vivo'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {item.instanceStates && Object.keys(item.instanceStates).length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-4">Instancias en Crónicas</h4>
                    <div className="space-y-3">
                      {Object.entries(item.instanceStates).map(([cronicaId, state]: [string, any]) => (
                        <div key={cronicaId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <button 
                            onClick={() => onNavigate?.('cronica', cronicaId)}
                            className="text-sm font-medium text-[#94a3b8] hover:text-[#7c3aed] transition-colors"
                          >
                            Crónica: {cronicaId.slice(0,8)}...
                          </button>
                          <span className="px-3 py-1 bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-bold rounded uppercase">
                            {state.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-[#7c3aed]/10 bg-black/20 flex gap-4">
          <button onClick={onEdit} className="flex-1 btn-primary py-4 flex items-center justify-center gap-3">
            <FileText className="w-5 h-5" />
            Editar Expediente
          </button>
          <button onClick={onClose} className="flex-1 py-4 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] font-medium border border-white/5">Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
}

export function EditarEntidadModal({ item, type, onClose }: { item: any, type: string, onClose: () => void }) {
  const [name, setName] = useState(item.name || '');
  const [description, setDescription] = useState(item.bio || item.description || '');
  const [race, setRace] = useState(item.race || 'Humano');
  const [charClass, setCharClass] = useState(item.class || 'Guerrero');
  const [extraProp, setExtraProp] = useState(item.dangerLevel || item.influence || item.type || '');
  const [padreId, setPadreId] = useState(item.padreId || '');
  const [aliadoId, setAliadoId] = useState(item.aliadoId || '');
  const [status, setStatus] = useState(item.status || 'Activo / Vivo');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem(`history_${item.id}`);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, [item.id]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[0];
    setName(lastState.name || '');
    setDescription(lastState.bio || lastState.description || '');
    setRace(lastState.race || 'Humano');
    setCharClass(lastState.class || 'Guerrero');
    setExtraProp(lastState.dangerLevel || lastState.influence || lastState.type || '');
    setPadreId(lastState.padreId || '');
    setAliadoId(lastState.aliadoId || '');
    setStatus(lastState.status || 'Activo / Vivo');
    
    const newHistory = history.slice(1);
    setHistory(newHistory);
    localStorage.setItem(`history_${item.id}`, JSON.stringify(newHistory));
  };

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try {
      let collectionName = '';
      let data: any = {
        name,
        status,
        updatedAt: serverTimestamp(),
      };

      if (type === 'personajes') {
        collectionName = COLLECTIONS.PERSONAJES;
        data = { ...data, race, class: charClass, bio: description, padreId, aliadoId };
      } else {
        data.description = description;
        if (type === 'bestiario') {
          collectionName = COLLECTIONS.BESTIARIO;
          data.dangerLevel = extraProp;
        } else if (type === 'facciones') {
          collectionName = COLLECTIONS.FACCIONES;
          data.influence = extraProp;
        } else if (type === 'objetos') {
          collectionName = COLLECTIONS.OBJETOS;
          data.type = extraProp;
        }
      }

      // Save to local history before updating
      const currentState = { ...item };
      const newHistory = [currentState, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem(`history_${item.id}`, JSON.stringify(newHistory));

      await setDoc(doc(db, collectionName, item.id), data, { merge: true });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, type);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="aura-card w-full max-w-xl p-10 border-[#7c3aed]/30 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-bold serif-text text-glow-gold">Editar Expediente</h3>
          {history.length > 0 && (
            <button 
              onClick={handleUndo}
              className="text-xs text-[#c6a052] hover:text-white transition-colors flex items-center gap-1 border border-[#c6a052]/30 px-3 py-1.5 rounded-full hover:bg-[#c6a052]/10"
              title="Deshacer último cambio"
            >
              Deshacer
            </button>
          )}
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Nombre</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
            />
          </div>

          {type === 'personajes' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Raza</label>
                  <input 
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Clase</label>
                  <input 
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">ID Padre / Creador</label>
                  <input 
                    value={padreId}
                    onChange={(e) => setPadreId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">ID Aliado Principal</label>
                  <input 
                    value={aliadoId}
                    onChange={(e) => setAliadoId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
            </>
          )}

          {type !== 'personajes' && (
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">
                {type === 'bestiario' ? 'Nivel de Peligro' : type === 'facciones' ? 'Nivel de Influencia' : 'Tipo de Objeto'}
              </label>
              <input 
                value={extraProp}
                onChange={(e) => setExtraProp(e.target.value)}
                className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Estado Global</label>
            <input 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Ej: Activo / Vivo, Muerto, Destruido..."
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">Descripción / Bio</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-[#7c3aed]/20 rounded-xl px-5 py-4 focus:border-[#7c3aed] outline-none transition-all text-[#e2e8f0] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] font-medium">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={saving || !name}
            className="btn-primary flex-1 py-4 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CrearEntidadModal({ user, activeTab, onClose }: { user: FirebaseUser, activeTab: string, onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [race, setRace] = useState('Humano');
  const [charClass, setCharClass] = useState('Guerrero');
  const [extraProp, setExtraProp] = useState('');
  const [padreId, setPadreId] = useState('');
  const [aliadoId, setAliadoId] = useState('');
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const prompt = window.prompt(`Ingresa una directriz para generar ${activeTab === 'personajes' ? 'el personaje' : activeTab === 'bestiario' ? 'la criatura' : activeTab === 'facciones' ? 'la facción' : 'el objeto'} (ej: 'Guerrero veterano con cicatrices'):`);
    if (!prompt) return;
    
    setGenerating(true);
    try {
      const typeStr = activeTab === 'personajes' ? 'un personaje' : activeTab === 'bestiario' ? 'una criatura' : activeTab === 'facciones' ? 'una facción' : 'un objeto';
      const aiPrompt = `Genera detalles para ${typeStr} de fantasía basado en esta idea: "${prompt}".
      Devuelve SOLO un objeto JSON válido con las siguientes propiedades:
      - name: Nombre de la entidad.
      - description: Descripción detallada y atmosférica.
      ${activeTab === 'personajes' ? '- race: Raza (ej: Humano, Elfo, Orco, etc).\n- charClass: Clase (ej: Guerrero, Mago, Pícaro, etc).' : ''}
      ${activeTab === 'bestiario' ? '- extraProp: Nivel de peligro (ej: Alto, Medio, Bajo, Desconocido).' : ''}
      ${activeTab === 'facciones' ? '- extraProp: Nivel de influencia (ej: Global, Regional, Local).' : ''}
      ${activeTab === 'objetos' ? '- extraProp: Tipo de objeto (ej: Arma, Reliquia, Consumible).' : ''}
      `;

      const response = await ai.models.generateContent({
        model: MODELS.TEXT,
        contents: aiPrompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (activeTab === 'personajes') {
        if (data.race) setRace(data.race);
        if (data.charClass) setCharClass(data.charClass);
      } else {
        if (data.extraProp) setExtraProp(data.extraProp);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error al generar contenido. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!name) return;
    if (activeTab === 'personajes' && !description) return;
    if (activeTab !== 'personajes' && !description) return;
    
    setCreating(true);
    let collectionName = '';
    try {
      let data: any = {
        userId: user.uid,
        name,
        createdAt: serverTimestamp(),
        worldId: null,
        status: 'Activo / Vivo'
      };

      if (activeTab === 'personajes') {
        collectionName = COLLECTIONS.PERSONAJES;
        const imagePrompt = `A high-quality, cinematic portrait of a ${race} ${charClass} named ${name}. ${description}. Fantasy art style, detailed lighting, epic atmosphere.`;
        const imageResponse = await ai.models.generateContent({
          model: MODELS.IMAGE,
          contents: imagePrompt,
          config: { imageConfig: { aspectRatio: "1:1" } }
        });

        let imageUrl = '';
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
            imageUrl = await compressImage(rawBase64, 512, 512);
            break;
          }
        }
        data = { ...data, race, class: charClass, bio: description, imageUrl, padreId, aliadoId };
      } else {
        if (activeTab === 'bestiario') {
          collectionName = COLLECTIONS.BESTIARIO;
          data = { ...data, description, dangerLevel: extraProp || 'Desconocido' };
        } else if (activeTab === 'facciones') {
          collectionName = COLLECTIONS.FACCIONES;
          data = { ...data, description, influence: extraProp || 'Desconocida' };
        } else if (activeTab === 'objetos') {
          collectionName = COLLECTIONS.OBJETOS;
          data = { ...data, description, type: extraProp || 'Común' };
        }
      }

      await addDoc(collection(db, collectionName), data);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0c]/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl p-10 bg-[#0a0a0a] border-[0.5px] border-[#c6a052] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
      >
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-bold font-cinzel text-glow-gold">
            Crear {activeTab === 'personajes' ? 'Personaje' : activeTab === 'bestiario' ? 'Criatura' : activeTab === 'facciones' ? 'Facción' : 'Objeto'}
          </h3>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-[#c6a052]/10 border border-[#c6a052]/30 rounded text-[#c6a052] hover:bg-[#c6a052]/20 transition-all text-sm font-bold tracking-widest uppercase flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Sugerir
          </button>
        </div>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Nombre</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la entidad..."
              className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] font-cinzel text-lg"
            />
          </div>

          {activeTab === 'personajes' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Raza</label>
                  <select 
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] appearance-none"
                  >
                    <option value="Humano" className="bg-[#0a0a0a]">Humano</option>
                    <option value="Elfo" className="bg-[#0a0a0a]">Elfo</option>
                    <option value="Enano" className="bg-[#0a0a0a]">Enano</option>
                    <option value="Orco" className="bg-[#0a0a0a]">Orco</option>
                    <option value="Mediano" className="bg-[#0a0a0a]">Mediano</option>
                    <option value="Dracónido" className="bg-[#0a0a0a]">Dracónido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Clase</label>
                  <select 
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] appearance-none"
                  >
                    <option value="Guerrero" className="bg-[#0a0a0a]">Guerrero</option>
                    <option value="Mago" className="bg-[#0a0a0a]">Mago</option>
                    <option value="Pícaro" className="bg-[#0a0a0a]">Pícaro</option>
                    <option value="Paladín" className="bg-[#0a0a0a]">Paladín</option>
                    <option value="Explorador" className="bg-[#0a0a0a]">Explorador</option>
                    <option value="Bardo" className="bg-[#0a0a0a]">Bardo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">ID Padre / Creador</label>
                  <input 
                    value={padreId}
                    onChange={(e) => setPadreId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">ID Aliado Principal</label>
                  <input 
                    value={aliadoId}
                    onChange={(e) => setAliadoId(e.target.value)}
                    placeholder="ID de la entidad..."
                    className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab !== 'personajes' && (
            <div>
              <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">
                {activeTab === 'bestiario' ? 'Nivel de Peligro' : activeTab === 'facciones' ? 'Nivel de Influencia' : 'Tipo de Objeto'}
              </label>
              <input 
                value={extraProp}
                onChange={(e) => setExtraProp(e.target.value)}
                placeholder={activeTab === 'bestiario' ? 'Ej: Alto, Medio, Bajo...' : activeTab === 'facciones' ? 'Ej: Global, Regional...' : 'Ej: Arma, Reliquia...'}
                className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Descripción</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los detalles de esta entidad..."
              rows={4}
              className="w-full bg-transparent border-b border-[#c6a052] px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none"
            />
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4 border-t border-[#c6a052]/20 pt-6">
          <button onClick={onClose} className="px-6 py-3 rounded text-[#94a3b8] hover:text-white transition-all font-bold tracking-widest uppercase text-sm">Cancelar</button>
          <button 
            onClick={handleCreate}
            disabled={creating || !name || !description}
            className="px-8 py-3 bg-[#c6a052] text-black font-bold tracking-widest uppercase text-sm rounded hover:bg-[#d4af37] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Crear Entidad
          </button>
        </div>
      </motion.div>
    </div>
  );
}

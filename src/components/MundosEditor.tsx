import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, ChevronDown, ChevronRight, Upload, Image as ImageIcon, Map, Scroll, Shield, Globe, BookOpen } from 'lucide-react';
import { Mundo, TreeNode } from '../schema-registry';
import { db, doc, updateDoc, storage, ref, uploadString, getDownloadURL } from '../lib/firebase';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { InteractiveMap } from './InteractiveMap';

interface MundosEditorProps {
  mundo: Mundo;
  onUpdate: (updatedMundo: Mundo) => void;
  readMode: boolean;
}

export function MundosEditor({ mundo, onUpdate, readMode }: MundosEditorProps) {
  const [localMundo, setLocalMundo] = useState<Mundo>(mundo);
  const [activeSection, setActiveSection] = useState<string | null>('nucleo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalMundo(mundo);
  }, [mundo]);

  const handleSave = async (field: keyof Mundo, value: any) => {
    if (mundo[field] === value) return; // No change
    
    setSaving(true);
    try {
      const updated = { ...localMundo, [field]: value };
      setLocalMundo(updated);
      await updateDoc(doc(db, 'mundos', mundo.id), { [field]: value });
      onUpdate(updated);
    } catch (error) {
      console.error("Error saving field:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSaving(true);
      try {
        const storageRef = ref(storage, `mundos/${mundo.id}/cover_${Date.now()}`);
        await uploadString(storageRef, base64String, 'data_url');
        const url = await getDownloadURL(storageRef);
        
        const updated = { ...localMundo, imageUrl: url };
        setLocalMundo(updated);
        await updateDoc(doc(db, 'mundos', mundo.id), { imageUrl: url });
        onUpdate(updated);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  if (readMode) {
    return (
      <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 bg-[#0a0a0c]">
        {localMundo.imageUrl && (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-8 border border-[#c6a052]/30">
            <img src={localMundo.imageUrl} alt={localMundo.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-5xl font-bold font-cinzel text-glow-gold mb-6">{localMundo.name}</h1>
        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-cinzel prose-headings:text-[#c6a052] prose-p:text-[#e2e8f0] prose-a:text-[#7c3aed]">
          <Markdown>{localMundo.description || '*Sin descripción*'}</Markdown>
          
          {localMundo.forbiddenLaws && (
            <>
              <h2>Leyes Prohibidas</h2>
              <Markdown>{localMundo.forbiddenLaws}</Markdown>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 bg-[#000000]">
      <div className="flex justify-between items-center mb-8">
        <input 
          value={localMundo.name}
          onChange={(e) => setLocalMundo({ ...localMundo, name: e.target.value })}
          onBlur={(e) => handleSave('name', e.target.value)}
          className="text-4xl font-bold font-cinzel text-glow-gold bg-transparent border-b border-transparent hover:border-[#c6a052]/30 focus:border-[#c6a052] outline-none transition-all w-full max-w-xl"
        />
        {saving && <span className="text-xs text-[#c6a052] animate-pulse">Guardando...</span>}
      </div>

      <div className="mb-8 relative group">
        {localMundo.imageUrl ? (
          <div className="w-full h-48 rounded-xl overflow-hidden border border-[#c6a052]/30 relative">
            <img src={localMundo.imageUrl} alt="Cover" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <label className="cursor-pointer px-4 py-2 bg-[#c6a052]/20 border border-[#c6a052] rounded text-[#c6a052] hover:bg-[#c6a052]/40 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Cambiar Imagen
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        ) : (
          <label className="w-full h-32 border-2 border-dashed border-[#c6a052]/30 rounded-xl flex flex-col items-center justify-center text-[#94a3b8] hover:text-[#c6a052] hover:border-[#c6a052] transition-colors cursor-pointer bg-white/5">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm">Arrastra una imagen o haz clic para subir</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      <div className="space-y-4">
        {/* Accordion: Núcleo y Leyes */}
        <AccordionSection 
          title="Núcleo y Leyes" 
          icon={<Globe className="w-5 h-5" />}
          isOpen={activeSection === 'nucleo'} 
          onToggle={() => toggleSection('nucleo')}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Descripción General</label>
              <textarea 
                value={localMundo.description || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, description: e.target.value })}
                onBlur={(e) => handleSave('description', e.target.value)}
                rows={4}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none"
                placeholder="La esencia de este mundo..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <SliderField label="Nivel de Magia" value={localMundo.magicLevel || 50} onChange={(v) => setLocalMundo({...localMundo, magicLevel: v})} onBlur={() => handleSave('magicLevel', localMundo.magicLevel)} />
              <SliderField label="Nivel Tecnológico" value={localMundo.techLevel || 50} onChange={(v) => setLocalMundo({...localMundo, techLevel: v})} onBlur={() => handleSave('techLevel', localMundo.techLevel)} />
              <SliderField label="Gravedad" value={localMundo.gravity || 50} onChange={(v) => setLocalMundo({...localMundo, gravity: v})} onBlur={() => handleSave('gravity', localMundo.gravity)} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Leyes Prohibidas (Markdown)</label>
              <textarea 
                value={localMundo.forbiddenLaws || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, forbiddenLaws: e.target.value })}
                onBlur={(e) => handleSave('forbiddenLaws', e.target.value)}
                rows={4}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0] resize-none font-mono text-sm"
                placeholder="Leyes inquebrantables de la física o la magia..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* Accordion: Geografía y Ecología */}
        <AccordionSection 
          title="Geografía y Ecología" 
          icon={<Map className="w-5 h-5" />}
          isOpen={activeSection === 'geografia'} 
          onToggle={() => toggleSection('geografia')}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Clima Predominante</label>
              <input 
                value={localMundo.climate || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, climate: e.target.value })}
                onBlur={(e) => handleSave('climate', e.target.value)}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                placeholder="Ej: Templado, Árido, Congelado..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Biomas (Separados por coma)</label>
              <input 
                value={localMundo.biomes?.join(', ') || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, biomes: e.target.value.split(',').map(s => s.trim()) })}
                onBlur={(e) => handleSave('biomes', localMundo.biomes)}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                placeholder="Ej: Bosques de cristal, Desiertos de ceniza..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Recursos Naturales</label>
              <input 
                value={localMundo.naturalResources?.join(', ') || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, naturalResources: e.target.value.split(',').map(s => s.trim()) })}
                onBlur={(e) => handleSave('naturalResources', localMundo.naturalResources)}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                placeholder="Ej: Mithril, Esencia Estelar..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* Accordion: Sociedad y Economía */}
        <AccordionSection 
          title="Sociedad y Economía" 
          icon={<Shield className="w-5 h-5" />}
          isOpen={activeSection === 'sociedad'} 
          onToggle={() => toggleSection('sociedad')}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Tipo de Gobierno</label>
                <input 
                  value={localMundo.governmentType || ''}
                  onChange={(e) => setLocalMundo({ ...localMundo, governmentType: e.target.value })}
                  onBlur={(e) => handleSave('governmentType', e.target.value)}
                  className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  placeholder="Ej: Monarquía Absoluta, Tecnocracia..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Moneda Principal</label>
                <input 
                  value={localMundo.currency || ''}
                  onChange={(e) => setLocalMundo({ ...localMundo, currency: e.target.value })}
                  onBlur={(e) => handleSave('currency', e.target.value)}
                  className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                  placeholder="Ej: Créditos, Piezas de Oro..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Idiomas Oficiales</label>
              <input 
                value={localMundo.officialLanguages?.join(', ') || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, officialLanguages: e.target.value.split(',').map(s => s.trim()) })}
                onBlur={(e) => handleSave('officialLanguages', localMundo.officialLanguages)}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                placeholder="Ej: Común, Élfico, Binario..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em] mb-2">Tabúes Sociales</label>
              <input 
                value={localMundo.socialTaboos?.join(', ') || ''}
                onChange={(e) => setLocalMundo({ ...localMundo, socialTaboos: e.target.value.split(',').map(s => s.trim()) })}
                onBlur={(e) => handleSave('socialTaboos', localMundo.socialTaboos)}
                className="w-full bg-transparent border-b border-[#c6a052]/50 px-0 py-2 focus:border-[#c6a052] outline-none transition-all text-[#e2e8f0]"
                placeholder="Ej: Uso de magia de sangre, IA no registrada..."
              />
            </div>
          </div>
        </AccordionSection>

        {/* Accordion: Cronología */}
        <AccordionSection 
          title="Cronología" 
          icon={<Scroll className="w-5 h-5" />}
          isOpen={activeSection === 'cronologia'} 
          onToggle={() => toggleSection('cronologia')}
        >
          <div className="space-y-6">
             <p className="text-sm text-[#94a3b8] italic">Gestión de Eras y Eventos (En desarrollo)</p>
             {/* Placeholder for complex timeline editing */}
          </div>
        </AccordionSection>

        {/* Accordion: Cartografía */}
        <AccordionSection 
          title="Cartografía" 
          icon={<Map className="w-5 h-5" />}
          isOpen={activeSection === 'cartografia'} 
          onToggle={() => toggleSection('cartografia')}
        >
          <div className="space-y-6 h-[500px]">
            <InteractiveMap worldId={localMundo.id} worldName={localMundo.name} />
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: { title: string, icon: React.ReactNode, isOpen: boolean, onToggle: () => void, children: React.ReactNode }) {
  return (
    <div className="border border-[#c6a052]/20 rounded-xl overflow-hidden bg-[#0a0a0a]">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3 text-[#c6a052] font-cinzel font-bold text-lg">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-[#c6a052]" /> : <ChevronRight className="w-5 h-5 text-[#c6a052]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-[#c6a052]/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SliderField({ label, value, onChange, onBlur }: { label: string, value: number, onChange: (v: number) => void, onBlur: () => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-bold text-[#c6a052] uppercase tracking-[0.2em]">{label}</label>
        <span className="text-xs text-[#e2e8f0] font-mono">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        onBlur={onBlur}
        className="w-full accent-[#c6a052]"
      />
    </div>
  );
}

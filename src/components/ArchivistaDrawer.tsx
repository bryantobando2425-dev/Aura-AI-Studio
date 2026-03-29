import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, ChevronRight } from 'lucide-react';

export type ArchivistaTopic = 'magic' | 'gravity' | 'tech' | null;

interface ArchivistaDrawerProps {
  topic: ArchivistaTopic;
  onClose: () => void;
}

export function ArchivistaDrawer({ topic, onClose }: ArchivistaDrawerProps) {
  const getContent = () => {
    switch (topic) {
      case 'magic':
        return (
          <>
            <h3 className="text-xl font-cinzel font-bold text-[#c6a052] uppercase tracking-widest border-b border-[#c6a052]/50 pb-2 mb-6">
              Nivel de Magia
            </h3>
            <p className="text-[#e2e8f0] mb-6 leading-relaxed">
              <strong className="text-[#c6a052]">Definición:</strong> Ley física fundamental de alteración de la realidad mediante voluntad o energía etérea.
            </p>
            
            <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider mb-4">Impacto en el Mundo</h4>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">0% (Latencia):</strong>
                  <p className="text-[#94a3b8] mt-1">La energía existe pero es inaccesible. No hay manifestaciones visibles ni manipulación posible.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">1-20% (Baja Fantasía):</strong>
                  <p className="text-[#94a3b8] mt-1">Fenómenos aislados, 'suerte' estadística, objetos con propiedades menores o rituales complejos.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">80-100% (Alta Fantasía):</strong>
                  <p className="text-[#94a3b8] mt-1">Omnipresencia. La voluntad altera la materia, el tiempo y la física de forma cotidiana.</p>
                </div>
              </li>
            </ul>

            <div className="bg-[#c6a052]/5 border-l-2 border-[#c6a052] p-4 rounded-r">
              <h4 className="text-xs font-bold text-[#c6a052] uppercase tracking-widest mb-2">Ejemplo Narrativo</h4>
              <p className="font-serif italic text-[#e2e8f0] leading-relaxed">
                "En los reinos de 80%, los rascacielos flotan sostenidos por runas de cristal, y los ciudadanos encienden sus hogares con un simple chasquido de dedos, mientras que en los páramos del 5%, un sanador es considerado un mesías o un hereje."
              </p>
            </div>
          </>
        );
      case 'gravity':
        return (
          <>
            <h3 className="text-xl font-cinzel font-bold text-[#c6a052] uppercase tracking-widest border-b border-[#c6a052]/50 pb-2 mb-6">
              Gravedad Base
            </h3>
            <p className="text-[#e2e8f0] mb-6 leading-relaxed">
              <strong className="text-[#c6a052]">Definición:</strong> Fuerza de atracción del cuerpo celeste principal que rige la física del entorno.
            </p>
            
            <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider mb-4">Impacto en el Mundo</h4>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">0.1g - 0.5g (Baja):</strong>
                  <p className="text-[#94a3b8] mt-1">Biología ligera y espigada, saltos de baja resistencia, estructuras arquitectónicas de gran altura y fragilidad aparente.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">1.0g (Estándar):</strong>
                  <p className="text-[#94a3b8] mt-1">Desarrollo evolutivo y estructural similar al terrestre.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">2.0g+ (Extrema):</strong>
                  <p className="text-[#94a3b8] mt-1">Biología densa y robusta. Requiere tecnología de soporte vital, exoesqueletos para movilidad básica o adaptaciones evolutivas severas.</p>
                </div>
              </li>
            </ul>

            <div className="bg-[#c6a052]/5 border-l-2 border-[#c6a052] p-4 rounded-r">
              <h4 className="text-xs font-bold text-[#c6a052] uppercase tracking-widest mb-2">Ejemplo Narrativo</h4>
              <p className="font-serif italic text-[#e2e8f0] leading-relaxed">
                "Los nativos de Kaelen (0.3g) se deslizan por el aire como hojas al viento, sus ciudades construidas en agujas de cristal imposibles en la Tierra. Por el contrario, los mineros de Vok (3.0g) apenas superan el metro de altura, con huesos densos como el plomo."
              </p>
            </div>
          </>
        );
      case 'tech':
        return (
          <>
            <h3 className="text-xl font-cinzel font-bold text-[#c6a052] uppercase tracking-widest border-b border-[#c6a052]/50 pb-2 mb-6">
              Nivel Tecnológico
            </h3>
            <p className="text-[#e2e8f0] mb-6 leading-relaxed">
              <strong className="text-[#c6a052]">Definición:</strong> Grado de manipulación técnica, científica y de recursos de la civilización dominante.
            </p>
            
            <h4 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider mb-4">Impacto en el Mundo</h4>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">Primitivo a Medieval:</strong>
                  <p className="text-[#94a3b8] mt-1">Herramientas básicas, forja de metales, agricultura dependiente del clima. Comunicación limitada a la velocidad del transporte físico.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">Industrial a Atómico:</strong>
                  <p className="text-[#94a3b8] mt-1">Mecanización masiva, fisión nuclear, telecomunicaciones globales. El mundo se encoge y los conflictos se globalizan.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-[#c6a052] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#e2e8f0]">Espacial a Singularidad:</strong>
                  <p className="text-[#94a3b8] mt-1">Viaje interestelar, manipulación genética a la carta, inteligencias artificiales superadoras y escasez post-material.</p>
                </div>
              </li>
            </ul>

            <div className="bg-[#c6a052]/5 border-l-2 border-[#c6a052] p-4 rounded-r">
              <h4 className="text-xs font-bold text-[#c6a052] uppercase tracking-widest mb-2">Ejemplo Narrativo</h4>
              <p className="font-serif italic text-[#e2e8f0] leading-relaxed">
                "Mientras que en los mundos industriales el humo de las fábricas oscurece el cielo y el telégrafo dicta el ritmo de la guerra, en las esferas de la Singularidad, las mentes se descargan en enjambres de nanobots para explorar el cosmos sin cuerpos físicos."
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {topic && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 bottom-0 w-[30%] min-w-[320px] bg-[#050505] border-l border-[#c6a052] z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-[#c6a052]/20 bg-[#0a0a0c]">
            <div className="flex items-center gap-3 text-[#c6a052]">
              <BookOpen className="w-6 h-6" />
              <h2 className="font-cinzel font-bold text-lg uppercase tracking-widest">El Archivista</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/5 rounded-full text-[#94a3b8] hover:text-[#c6a052] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-sans text-sm">
            {getContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

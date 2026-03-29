import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MapPin, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineScrollerProps {
  startYear: number;
  onChange: (year: number) => void;
  onSuggest?: () => void;
}

export function TimelineScroller({ startYear, onChange, onSuggest }: TimelineScrollerProps) {
  const [year, setYear] = useState(startYear || 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const [customEraName, setCustomEraName] = useState('Singularidad');
  const [isEditingEra, setIsEditingEra] = useState(false);

  // Determine Era and Color based on year
  const getEraInfo = (y: number) => {
    if (y < -3000) return { name: 'Edad de Piedra', color: '#8B7355' }; // Marrón piedra
    if (y < 0) return { name: 'Edad de Bronce', color: '#CD7F32' }; // Bronce
    if (y < 500) return { name: 'Antigüedad Clásica', color: '#C0C0C0' }; // Plata/Mármol
    if (y < 1500) return { name: 'Era Medieval', color: '#4682B4' }; // Acero
    if (y < 1800) return { name: 'Renacimiento', color: '#DAA520' }; // Oro
    if (y < 1950) return { name: 'Revolución Industrial', color: '#708090' }; // Pizarra/Humo
    if (y < 2050) return { name: 'Era de la Información', color: '#00CED1' }; // Cian
    if (y <= 3000) return { name: 'Era Espacial', color: '#9370DB' }; // Púrpura espacial
    return { name: customEraName, color: '#00FFFF', isCustomizable: true }; // Neón cian
  };

  const eraInfo = getEraInfo(year);

  const formatYear = (y: number) => {
    if (y < 0) return `${Math.abs(y)} A.C.`;
    if (y > 0 && y <= 500) return `${y} D.C.`;
    if (y > 500) return `${y}`;
    return 'Año 0';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft || 0);
    startScrollLeft.current = containerRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    onChange(year);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2; // Scroll speed
    if (containerRef.current) {
      containerRef.current.scrollLeft = startScrollLeft.current - walk;
      
      // Calculate year based on scroll position
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      const scrollPercentage = containerRef.current.scrollLeft / maxScroll;
      const newYear = Math.round(-10000 + (scrollPercentage * 20000));
      setYear(Math.max(-10000, Math.min(10000, newYear)));
    }
  };

  // Initialize scroll position based on startYear
  useEffect(() => {
    if (containerRef.current) {
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      const percentage = (startYear + 10000) / 20000;
      containerRef.current.scrollLeft = percentage * maxScroll;
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[#c6a052] font-cinzel text-xs tracking-widest uppercase">Punto de Inicio Narrativo</h3>
          {onSuggest && (
            <button onClick={onSuggest} className="p-1 rounded hover:bg-white/5 text-[#c6a052]/50 hover:text-[#c6a052] transition-colors" title="Sugerencia de IA">
              <Sparkles className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xl font-mono font-bold" style={{ color: eraInfo.color }}>
            {formatYear(year)}
          </div>
          <div className="flex items-center gap-2">
            {isEditingEra && eraInfo.isCustomizable ? (
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={customEraName}
                  onChange={(e) => setCustomEraName(e.target.value)}
                  className="bg-transparent border-b border-[#c6a052] text-xs text-[#e2e8f0] uppercase tracking-wider focus:outline-none w-24 text-right"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingEra(false)}
                  onBlur={() => setIsEditingEra(false)}
                />
                <button onClick={() => setIsEditingEra(false)} className="text-[#c6a052] hover:text-white">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-[#94a3b8] uppercase tracking-wider">{eraInfo.name}</div>
                {eraInfo.isCustomizable && (
                  <button onClick={() => setIsEditingEra(true)} className="text-[#94a3b8] hover:text-[#c6a052] transition-colors" title="Editar Nombre de Era">
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div 
        className="relative w-full h-16 bg-[#050505] border border-[#c6a052]/20 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          isDragging.current = true;
          startX.current = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
          startScrollLeft.current = containerRef.current?.scrollLeft || 0;
        }}
        onTouchEnd={handleMouseUp}
        onTouchMove={(e) => {
          if (!isDragging.current) return;
          const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
          const walk = (x - startX.current) * 2;
          if (containerRef.current) {
            containerRef.current.scrollLeft = startScrollLeft.current - walk;
            const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
            const scrollPercentage = containerRef.current.scrollLeft / maxScroll;
            const newYear = Math.round(-10000 + (scrollPercentage * 20000));
            setYear(Math.max(-10000, Math.min(10000, newYear)));
          }
        }}
        onScroll={() => {
          if (containerRef.current && !isDragging.current) {
            const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
            const scrollPercentage = containerRef.current.scrollLeft / maxScroll;
            const newYear = Math.round(-10000 + (scrollPercentage * 20000));
            setYear(Math.max(-10000, Math.min(10000, newYear)));
            onChange(Math.max(-10000, Math.min(10000, newYear)));
          }
        }}
      >
        {/* The infinite ruler visual */}
        <div className="absolute top-0 bottom-0 flex items-end" style={{ width: '4000px', left: '50%', transform: 'translateX(-50%)' }}>
          {/* Generate tick marks */}
          {Array.from({ length: 101 }).map((_, i) => {
            const isMajor = i % 10 === 0;
            const tickYear = -10000 + (i * 200);
            return (
              <div key={i} className="flex flex-col items-center justify-end h-full relative" style={{ width: '40px' }}>
                {isMajor && (
                  <span className="absolute top-1 text-[10px] text-[#94a3b8]/50 font-mono whitespace-nowrap">
                    {formatYear(tickYear)}
                  </span>
                )}
                <div 
                  className={cn("w-px bg-[#c6a052]/30", isMajor ? "h-6" : "h-3")}
                  style={{ backgroundColor: isMajor ? getEraInfo(tickYear).color : undefined, opacity: isMajor ? 0.8 : 0.3 }}
                />
              </div>
            );
          })}
        </div>

        {/* Center Indicator */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/80 transform -translate-x-1/2 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-[#94a3b8]/50 font-mono uppercase">
        <span>-10,000 (Pasado Antiguo)</span>
        <span>Desliza para viajar en el tiempo</span>
        <span>+10,000 (Futuro Lejano)</span>
      </div>
    </div>
  );
}

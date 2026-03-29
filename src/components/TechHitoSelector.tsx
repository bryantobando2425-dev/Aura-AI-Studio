import React, { useRef, useEffect } from 'react';
import { Flame, Hammer, Sword, Factory, Atom, Cpu, Rocket, Infinity } from 'lucide-react';
import { cn } from '../lib/utils';

export const TECH_LEVELS = [
  { name: 'Primitivo', value: 10, icon: Flame },
  { name: 'Antiguo', value: 20, icon: Hammer },
  { name: 'Medieval', value: 30, icon: Sword },
  { name: 'Industrial', value: 50, icon: Factory },
  { name: 'Atómico', value: 70, icon: Atom },
  { name: 'Digital', value: 80, icon: Cpu },
  { name: 'Espacial', value: 90, icon: Rocket },
  { name: 'Singularidad', value: 100, icon: Infinity },
];

interface TechHitoSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function TechHitoSelector({ value, onChange, disabled }: TechHitoSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeElement) {
        const container = scrollRef.current;
        const scrollLeft = activeElement.offsetLeft - container.clientWidth / 2 + activeElement.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [value]);

  return (
    <div className={cn("relative w-full overflow-hidden py-4", disabled && "opacity-30 pointer-events-none")}>
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-[calc(50%-3rem)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TECH_LEVELS.map((level) => {
          const isActive = value === level.value;
          const Icon = level.icon;
          return (
            <button
              key={level.name}
              data-active={isActive}
              onClick={() => onChange(level.value)}
              className={cn(
                "snap-center flex-shrink-0 flex flex-col items-center justify-center w-24 h-32 rounded-xl border transition-all duration-300",
                isActive 
                  ? "bg-[#c6a052]/20 border-[#c6a052] text-[#c6a052] scale-100 shadow-[0_0_15px_rgba(198,160,82,0.3)]" 
                  : "bg-[#0a0a0c] border-[#333] text-[#94a3b8] scale-90 opacity-40 hover:opacity-70"
              )}
            >
              <Icon className={cn("w-8 h-8 mb-3 transition-colors", isActive ? "text-[#c6a052]" : "text-[#94a3b8]")} />
              <span className="font-cinzel text-[10px] uppercase tracking-widest text-center px-1">
                {level.name}
              </span>
            </button>
          );
        })}
      </div>
      {/* Gradient masks for smooth edges */}
      <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#000000] to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#000000] to-transparent pointer-events-none" />
    </div>
  );
}

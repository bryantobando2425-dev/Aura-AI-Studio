import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModoLecturaProps {
  title: string;
  image?: string;
  content: React.ReactNode;
  onClose: () => void;
}

export function ModoLectura({ title, image, content, onClose }: ModoLecturaProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto custom-scrollbar"
    >
      <button 
        onClick={onClose}
        className="fixed top-8 right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/10 z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-3xl mx-auto px-8 py-24 min-h-screen flex flex-col">
        {image && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-16 border border-white/10 shadow-2xl">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <h1 className="text-6xl font-bold font-cinzel text-white mb-16 text-center tracking-wide leading-tight">
          {title}
        </h1>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-cinzel prose-headings:text-[#c6a052] prose-p:text-[#e2e8f0] prose-p:leading-relaxed prose-a:text-[#7c3aed] prose-strong:text-white">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

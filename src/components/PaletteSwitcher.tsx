// src/components/PaletteSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../lib/ThemeContext.tsx';
import { Palette, Check, Shuffle, Sparkles, X } from 'lucide-react';

export const PaletteSwitcher: React.FC = () => {
  const { currentPalette, palettes, setPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const otherPalettes = palettes.filter(p => p.id !== currentPalette.id);
    if (otherPalettes.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherPalettes.length);
      setPalette(otherPalettes[randomIndex]);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button - PaletteMaker Pill Aesthetic */}
      <div className="flex items-center space-x-1.5 bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-xl border border-white/10 transition-all shadow-sm group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 outline-none"
          title={`Active Palette: ${currentPalette.name} (Click to change)`}
        >
          <Palette className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-45 transition-transform" />

          {/* Color preview dots */}
          <div className="flex items-center -space-x-1 px-0.5">
            {currentPalette.colors.slice(0, 3).map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-slate-900 shadow-xs shrink-0"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <span className="text-[11px] font-semibold tracking-tight text-slate-300 hidden xl:inline">
            {currentPalette.name}
          </span>
        </button>

        {/* Quick Shuffle button like PaletteMaker */}
        <button
          onClick={handleShuffle}
          className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition"
          title="Shuffle / Next Palette"
        >
          <Shuffle className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown Panel - PaletteMaker Card Display */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl z-50 p-4 text-white animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <div>
                <h4 className="text-sm font-bold tracking-tight text-white">PaletteMaker Design Themes</h4>
                <p className="text-[11px] text-slate-400">Curated harmonious color systems for CA tools</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Palette list */}
          <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {palettes.map(palette => {
              const isSelected = palette.id === currentPalette.id;
              return (
                <div
                  key={palette.id}
                  onClick={() => {
                    setPalette(palette);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-500/80 shadow-md ring-1 ring-teal-500/30'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{palette.name}</span>
                      {isSelected && (
                        <span className="flex items-center text-[10px] text-teal-300 font-semibold bg-teal-950/80 border border-teal-700/60 px-1.5 py-0.2 rounded-full">
                          <Check className="w-2.5 h-2.5 mr-0.5" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2.5 leading-snug">
                    {palette.description}
                  </p>

                  {/* PaletteMaker Swatch Bar */}
                  <div className="flex items-center gap-1.5">
                    {palette.colors.map((hex, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-5 rounded-md border border-white/10 shadow-sm relative group/swatch transition-transform hover:scale-105"
                        style={{
                          backgroundColor: hex,
                          boxShadow: `0 4px 10px ${hex}40`,
                        }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PaletteMaker Citation Footer */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>PaletteMaker UI Engine</span>
            <button
              onClick={handleShuffle}
              className="text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1"
            >
              <Shuffle className="w-3 h-3" />
              <span>Random Palette</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

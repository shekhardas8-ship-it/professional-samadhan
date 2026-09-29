// src/lib/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPalette, PALETTES, getActivePalette, applyTheme } from './theme.ts';

interface ThemeContextType {
  currentPalette: ColorPalette;
  palettes: ColorPalette[];
  setPalette: (palette: ColorPalette) => void;
  setPaletteById: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentPalette: PALETTES[0],
  palettes: PALETTES,
  setPalette: () => {},
  setPaletteById: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(PALETTES[0]);

  useEffect(() => {
    const initial = getActivePalette();
    setCurrentPalette(initial);
    applyTheme(initial);
  }, []);

  const handleSetPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    applyTheme(palette);
  };

  const handleSetPaletteById = (id: string) => {
    const found = PALETTES.find(p => p.id === id);
    if (found) {
      handleSetPalette(found);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentPalette,
        palettes: PALETTES,
        setPalette: handleSetPalette,
        setPaletteById: handleSetPaletteById,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

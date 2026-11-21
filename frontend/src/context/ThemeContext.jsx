import { createContext, useContext, useEffect, useState } from 'react';

export const TEMAS = [
  { id: 'esmeralda', nombre: 'Esmeralda', color: '#15803d' },
  { id: 'bosque', nombre: 'Bosque', color: '#166534' },
  { id: 'menta', nombre: 'Menta', color: '#0d9488' },
  { id: 'noche', nombre: 'Noche', color: '#065f46' },
];

const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('gc_tema') || 'esmeralda');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('gc_tema', tema);
  }, [tema]);
  return <Ctx.Provider value={{ tema, setTema }}>{children}</Ctx.Provider>;
}

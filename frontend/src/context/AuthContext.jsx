import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('gc_token')) { setCargando(false); return; }
    api.me().then((r) => setUser(r.user)).catch(() => localStorage.removeItem('gc_token')).finally(() => setCargando(false));
  }, []);

  function sesion(token, u) { localStorage.setItem('gc_token', token); setUser(u); }
  function salir() { localStorage.removeItem('gc_token'); setUser(null); }

  return (
    <Ctx.Provider value={{ user, cargando, sesion, salir, setUser, esAdmin: user?.rol === 'admin' }}>
      {children}
    </Ctx.Provider>
  );
}

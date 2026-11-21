import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bus, Shield, Palette, LogIn, User } from 'lucide-react';
import { useTheme, TEMAS } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { tema, setTema } = useTheme();
  const { user } = useAuth();
  const [sheet, setSheet] = useState(false);
  const loc = useLocation();
  const on = (p) => (loc.pathname === p ? 'on' : '');

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/icono.svg" alt="" />
          Guía Chillanes
        </Link>
        <span className="spacer" />
        <button className="iconbtn" title="Cambiar tema" onClick={() => setSheet(true)}><Palette size={20} /></button>
      </header>

      <main className="app">{children}</main>

      <nav className="tabbar">
        <Link to="/" className={on('/')}><Home size={20} /><span>Inicio</span></Link>
        <Link to="/transporte" className={on('/transporte')}><Bus size={20} /><span>Transporte</span></Link>
        <Link to="/gad" className={on('/gad')}><Shield size={20} /><span>GAD</span></Link>
        {user
          ? <Link to="/cuenta" className={on('/cuenta')}><User size={20} /><span>Cuenta</span></Link>
          : <Link to="/login" className={on('/login')}><LogIn size={20} /><span>Ingresar</span></Link>}
      </nav>

      {sheet && (
        <div className="sheet-bg" onClick={() => setSheet(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Elige un tema</h3>
            <div className="theme-row">
              {TEMAS.map((t) => (
                <button key={t.id} className={'theme-opt' + (tema === t.id ? ' sel' : '')} onClick={() => { setTema(t.id); }}>
                  <span className="theme-dot" style={{ background: t.color }} />
                  {t.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

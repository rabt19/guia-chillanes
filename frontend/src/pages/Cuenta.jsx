import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, ShieldCheck, LogOut, Settings } from 'lucide-react';

export default function Cuenta() {
  const { user, setUser, salir, esAdmin } = useAuth();
  const nav = useNavigate();
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function iniciar2fa() {
    setErr(''); setMsg('');
    try { const r = await api.setup2fa(); setQr(r); } catch (e) { setErr(e.message); }
  }
  async function activar2fa(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try { await api.enable2fa(code); setUser({ ...user, totp_activo: true }); setQr(null); setCode(''); setMsg('Verificación en dos pasos activada.'); }
    catch (e) { setErr(e.message); }
  }
  async function desactivar2fa() {
    setErr(''); setMsg('');
    const c = prompt('Ingresa un código actual de tu app para desactivar el 2FA:');
    if (c == null) return;
    try { await api.disable2fa(c); setUser({ ...user, totp_activo: false }); setMsg('2FA desactivado.'); }
    catch (e) { setErr(e.message); }
  }

  return (
    <div className="container">
      <h1 className="h-title">Hola, {user.nombre}</h1>
      <p className="h-sub">{user.email} · {esAdmin ? 'Administrador' : 'Usuario'}</p>

      {msg && <div className="msg ok">{msg}</div>}
      {err && <div className="msg err">{err}</div>}

      {esAdmin && (
        <Link to="/admin" className="btn grad block" style={{ marginBottom: 12 }}><Settings size={18} /> Administrar contenido</Link>
      )}

      <div className="form" style={{ margin: '0 0 12px' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {user.totp_activo ? <ShieldCheck size={20} /> : <Shield size={20} />} Verificación en dos pasos (2FA)
        </h3>
        {user.totp_activo ? (
          <>
            <p className="muted">Está activada: al entrar te pediremos un código de tu app.</p>
            <button className="btn block" onClick={desactivar2fa}>Desactivar 2FA</button>
          </>
        ) : qr ? (
          <form onSubmit={activar2fa}>
            <p className="muted">1. Escanea este código con Google Authenticator / Authy.</p>
            <img className="qr-img" src={qr.qr} alt="QR 2FA" />
            <p className="muted">2. Ingresa el código de 6 dígitos que muestra la app.</p>
            <div className="field">
              <input inputMode="numeric" maxLength={6} style={{ textAlign: 'center', fontSize: 20, letterSpacing: 5 }}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <button className="btn grad block">Activar</button>
          </form>
        ) : (
          <>
            <p className="muted">Protege tu cuenta con un segundo factor. Necesitas una app como Google Authenticator.</p>
            <button className="btn grad block" onClick={iniciar2fa}>Activar 2FA</button>
          </>
        )}
      </div>

      <button className="btn block" onClick={() => { salir(); nav('/'); }}><LogOut size={18} /> Cerrar sesión</button>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { sesion } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paso, setPaso] = useState('cred');   // 'cred' | '2fa'
  const [pending, setPending] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault(); setErr(''); setCargando(true);
    try {
      const r = await api.login({ email, password });
      if (r.need2fa) { setPending(r.pendingToken); setPaso('2fa'); }
      else { sesion(r.token, r.user); nav('/cuenta'); }
    } catch (e) { setErr(e.message); } finally { setCargando(false); }
  }

  async function verificar(e) {
    e.preventDefault(); setErr(''); setCargando(true);
    try {
      const r = await api.login2fa({ pendingToken: pending, code });
      sesion(r.token, r.user); nav('/cuenta');
    } catch (e) { setErr(e.message); } finally { setCargando(false); }
  }

  return (
    <div className="container">
      <form className="form" onSubmit={paso === 'cred' ? entrar : verificar}>
        <h2 className="center" style={{ marginTop: 0 }}>Iniciar sesión</h2>
        {err && <div className="msg err">{err}</div>}

        {paso === 'cred' ? (
          <>
            <div className="field"><label>Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="field"><label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <button className="btn grad block" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button>
            <p className="center muted" style={{ marginTop: 14 }}>¿No tienes cuenta? <Link className="link" to="/registro">Regístrate</Link></p>
          </>
        ) : (
          <>
            <p className="muted center">Ingresa el código de 6 dígitos de tu app de autenticación.</p>
            <div className="field">
              <input inputMode="numeric" maxLength={6} style={{ textAlign: 'center', fontSize: 22, letterSpacing: 6 }}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
            </div>
            <button className="btn grad block" disabled={cargando}>{cargando ? 'Verificando…' : 'Verificar'}</button>
          </>
        )}
      </form>
    </div>
  );
}

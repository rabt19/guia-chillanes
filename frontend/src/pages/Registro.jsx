import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Registro() {
  const { sesion } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nombre: '', email: '', password: '', password2: '' });
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function registrar(e) {
    e.preventDefault(); setErr('');
    if (f.password.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.');
    if (f.password !== f.password2) return setErr('Las contraseñas no coinciden.');
    setCargando(true);
    try {
      const r = await api.register({ nombre: f.nombre, email: f.email, password: f.password });
      sesion(r.token, r.user);
      nav('/cuenta');
    } catch (e) { setErr(e.message); } finally { setCargando(false); }
  }

  return (
    <div className="container">
      <form className="form" onSubmit={registrar}>
        <h2 className="center" style={{ marginTop: 0 }}>Crear cuenta</h2>
        {err && <div className="msg err">{err}</div>}
        <div className="field"><label>Nombre</label><input value={f.nombre} onChange={set('nombre')} required /></div>
        <div className="field"><label>Correo</label><input type="email" value={f.email} onChange={set('email')} required /></div>
        <div className="field"><label>Contraseña</label><input type="password" value={f.password} onChange={set('password')} required /></div>
        <div className="field"><label>Repite la contraseña</label><input type="password" value={f.password2} onChange={set('password2')} required /></div>
        <button className="btn grad block" disabled={cargando}>{cargando ? 'Creando…' : 'Registrarme'}</button>
        <p className="center muted" style={{ marginTop: 14 }}>¿Ya tienes cuenta? <Link className="link" to="/login">Inicia sesión</Link></p>
        <p className="center muted">Podrás activar la verificación en dos pasos (2FA) desde tu cuenta.</p>
      </form>
    </div>
  );
}

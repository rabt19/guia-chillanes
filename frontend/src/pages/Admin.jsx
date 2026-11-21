import { useEffect, useState, useRef } from 'react';
import { api, fotoUrl } from '../api.js';
import { Loader, Vacio } from '../components/ui.jsx';
import { Plus, Trash2, Upload, Copy } from 'lucide-react';

export default function Admin() {
  const [tab, setTab] = useState('negocios');
  return (
    <div className="container">
      <h1 className="h-title">Administración</h1>
      <div className="tabs">
        <button className={'tab' + (tab === 'negocios' ? ' on' : '')} onClick={() => setTab('negocios')}>Negocios</button>
        <button className={'tab' + (tab === 'turnos' ? ' on' : '')} onClick={() => setTab('turnos')}>Turnos</button>
      </div>
      {tab === 'negocios' ? <Negocios /> : <Turnos />}
    </div>
  );
}

const VACIO = { id_categoria: '', nombre: '', propietario: '', descripcion: '', telefono: '', whatsapp: '', direccion: '', referencia: '', foto_url: '', destacado: false };

function Negocios() {
  const [cats, setCats] = useState([]);
  const [negs, setNegs] = useState(null);
  const [f, setF] = useState(VACIO);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const cargar = () => api.negocios('?').then(setNegs).catch(() => setNegs([]));
  useEffect(() => { api.categorias().then(setCats); cargar(); }, []);

  async function subir(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setSubiendo(true); setErr('');
    try { const r = await api.subirFoto(file); setF((p) => ({ ...p, foto_url: r.foto_url })); }
    catch (e) { setErr(e.message); } finally { setSubiendo(false); }
  }

  async function guardar(e) {
    e.preventDefault(); setErr(''); setMsg('');
    const body = { ...f, id_categoria: Number(f.id_categoria) };
    try {
      if (editId) await api.editarNegocio(editId, body);
      else await api.crearNegocio(body);
      setF(VACIO); setEditId(null); setMsg('Guardado.'); cargar();
    } catch (e) { setErr(e.message); }
  }
  function editar(n) { setEditId(n.id); setF({ ...VACIO, ...n, id_categoria: n.id_categoria }); window.scrollTo(0, 0); }
  async function borrar(id) { if (confirm('¿Ocultar este negocio?')) { await api.borrarNegocio(id); cargar(); } }

  return (
    <>
      <form className="form" style={{ margin: '0 0 16px' }} onSubmit={guardar}>
        <h3 style={{ marginTop: 0 }}>{editId ? 'Editar negocio' : 'Nuevo negocio'}</h3>
        {err && <div className="msg err">{err}</div>}
        {msg && <div className="msg ok">{msg}</div>}
        <div className="field"><label>Categoría</label>
          <select value={f.id_categoria} onChange={set('id_categoria')} required>
            <option value="">Selecciona…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select></div>
        <div className="field"><label>Nombre comercial</label><input value={f.nombre} onChange={set('nombre')} required /></div>
        <div className="field"><label>Propietario / contacto</label><input value={f.propietario} onChange={set('propietario')} /></div>
        <div className="field"><label>Descripción</label><textarea rows={2} value={f.descripcion} onChange={set('descripcion')} /></div>
        <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={set('telefono')} /></div>
        <div className="field"><label>WhatsApp (solo números)</label><input value={f.whatsapp} onChange={set('whatsapp')} placeholder="0991234567" /></div>
        <div className="field"><label>Dirección</label><input value={f.direccion} onChange={set('direccion')} /></div>
        <div className="field"><label>Referencia (ej. ruta)</label><input value={f.referencia} onChange={set('referencia')} /></div>
        <div className="field">
          <label>Foto</label>
          <label className="btn block" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {subiendo ? 'Subiendo…' : f.foto_url ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={subir} />
          </label>
          {f.foto_url && <img src={fotoUrl(f.foto_url)} alt="" style={{ width: '100%', borderRadius: 12, marginTop: 8, maxHeight: 160, objectFit: 'cover' }} />}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={f.destacado} onChange={set('destacado')} /> Destacado</label>
        <button className="btn grad block"><Plus size={18} /> {editId ? 'Guardar cambios' : 'Crear negocio'}</button>
        {editId && <button type="button" className="btn block" style={{ marginTop: 8 }} onClick={() => { setEditId(null); setF(VACIO); }}>Cancelar edición</button>}
      </form>

      {!negs ? <Loader /> : negs.length === 0 ? <Vacio>Sin negocios aún.</Vacio> : negs.map((n) => (
        <div className="row-item" key={n.id}>
          <div className="grow">
            <div style={{ fontWeight: 700 }}>{n.nombre}</div>
            <div className="muted">{n.categoria_nombre}{n.destacado ? ' · ★' : ''}</div>
          </div>
          <button className="btn" onClick={() => editar(n)}>Editar</button>
          <button className="btn" onClick={() => borrar(n.id)}><Trash2 size={16} /></button>
        </div>
      ))}
    </>
  );
}

const TVACIO = { cooperativa: '', origen: '', destino: '', hora: '', dias: 'L-D', telefono: '', whatsapp: '', nota: '' };
function Turnos() {
  const [turnos, setTurnos] = useState(null);
  const [f, setF] = useState(TVACIO);
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const cargar = () => api.turnos('').then(setTurnos).catch(() => setTurnos([]));
  useEffect(() => { cargar(); }, []);

  const horaRef = useRef(null);

  async function crear(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await api.crearTurno(f);
      // mantiene la ruta y limpia solo la hora, para agregar varias horas seguidas
      setF({ ...f, hora: '' });
      setMsg('Turno agregado. Cambia la hora y agrega otro.');
      cargar();
      horaRef.current?.focus();
    } catch (e) { setErr(e.message); }
  }
  // copia un turno al formulario con la hora en blanco (clonar)
  function clonar(t) {
    setF({ cooperativa: t.cooperativa, origen: t.origen, destino: t.destino, hora: '',
           dias: t.dias || 'L-D', telefono: t.telefono || '', whatsapp: t.whatsapp || '', nota: t.nota || '' });
    setMsg(''); setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => horaRef.current?.focus(), 300);
  }
  async function borrar(id) { if (confirm('¿Quitar turno?')) { await api.borrarTurno(id); cargar(); } }

  return (
    <>
      <form className="form" style={{ margin: '0 0 16px' }} onSubmit={crear}>
        <h3 style={{ marginTop: 0 }}>Nuevo turno</h3>
        {err && <div className="msg err">{err}</div>}
        {msg && <div className="msg ok">{msg}</div>}
        <div className="field"><label>Cooperativa</label><input value={f.cooperativa} onChange={set('cooperativa')} required /></div>
        <div className="field"><label>Origen</label><input value={f.origen} onChange={set('origen')} required /></div>
        <div className="field"><label>Destino</label><input value={f.destino} onChange={set('destino')} required /></div>
        <div className="field"><label>Hora</label><input ref={horaRef} type="time" value={f.hora} onChange={set('hora')} required /></div>
        <div className="field"><label>Días</label><input value={f.dias} onChange={set('dias')} placeholder="L-D" /></div>
        <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={set('telefono')} /></div>
        <div className="field"><label>WhatsApp</label><input value={f.whatsapp} onChange={set('whatsapp')} /></div>
        <div className="field"><label>Nota</label><input value={f.nota} onChange={set('nota')} placeholder="ej. Pasa por Chillanes" /></div>
        <button className="btn grad block"><Plus size={18} /> Agregar turno</button>
      </form>

      {!turnos ? <Loader /> : turnos.length === 0 ? <Vacio>Sin turnos.</Vacio> : turnos.map((t) => (
        <div className="row-item" key={t.id}>
          <span className="hora" style={{ minWidth: 56 }}>{String(t.hora).slice(0, 5)}</span>
          <div className="grow">
            <div style={{ fontWeight: 700 }}>{t.origen} → {t.destino}</div>
            <div className="muted">{t.cooperativa} · {t.dias}</div>
          </div>
          <button className="btn" title="Clonar (misma ruta, nueva hora)" onClick={() => clonar(t)}><Copy size={16} /></button>
          <button className="btn" onClick={() => borrar(t.id)}><Trash2 size={16} /></button>
        </div>
      ))}
    </>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, fotoUrl } from '../api.js';
import { CatIcon, Phone, MessageCircle, MapPin, waHref, telHref, Loader } from '../components/ui.jsx';

export default function NegocioDetalle() {
  const { id } = useParams();
  const [n, setN] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.negocio(id).then(setN).catch(() => setErr('No se encontró el negocio.')); }, [id]);

  if (err) return <div className="container"><p className="h-sub">{err}</p></div>;
  if (!n) return <div className="container"><Loader /></div>;

  const wa = waHref(n.whatsapp, `Hola ${n.nombre}, los contacto desde la Guía Chillanes.`);
  const tel = telHref(n.telefono);

  return (
    <div className="container">
      <div className="card">
        {n.foto_url
          ? <img className="foto" style={{ height: 230 }} src={fotoUrl(n.foto_url)} alt={n.nombre} />
          : <div className="foto-fb" style={{ height: 230 }}><CatIcon name={n.categoria_slug} size={60} /></div>}
        <div className="body">
          <h1 className="h-title" style={{ margin: 0 }}>{n.nombre}</h1>
          {n.propietario && <div className="prop">Contacto: {n.propietario}</div>}
          <div style={{ marginTop: 8 }}><span className="chip">{n.categoria_nombre}</span></div>
          {n.descripcion && <p className="desc">{n.descripcion}</p>}
          {n.referencia && <p className="muted" style={{ marginTop: 8 }}>{n.referencia}</p>}
          {n.direccion && <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={15} /> {n.direccion}</p>}

          <div className="acciones">
            {wa && <a className="btn wa" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>}
            {tel && <a className="btn grad" href={tel}><Phone size={18} /> Llamar</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

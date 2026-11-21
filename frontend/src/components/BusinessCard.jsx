import { fotoUrl } from '../api.js';
import { CatIcon, Star } from './ui.jsx';

export default function BusinessCard({ n, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {n.foto_url
        ? <img className="foto" src={fotoUrl(n.foto_url)} alt={n.nombre} loading="lazy" />
        : <div className="foto-fb"><CatIcon name={n.categoria_icono} size={44} /></div>}
      <div className="body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="nom" style={{ flex: 1 }}>{n.nombre}</span>
          {n.destacado && <span className="chip badge-dest"><Star size={13} /> Destacado</span>}
        </div>
        {n.propietario && <div className="prop">{n.propietario}</div>}
        <div style={{ marginTop: 8 }}><span className="chip"><CatIcon name={n.categoria_icono} size={13} /> {n.categoria_nombre}</span></div>
        {n.descripcion && <p className="desc">{n.descripcion.slice(0, 90)}{n.descripcion.length > 90 ? '…' : ''}</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Phone, MessageCircle, waHref, telHref, Loader, Vacio } from '../components/ui.jsx';
import { Bus } from 'lucide-react';

export default function Transporte() {
  const [turnos, setTurnos] = useState(null);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');

  const cargar = () => {
    const p = new URLSearchParams();
    if (origen) p.set('origen', origen);
    if (destino) p.set('destino', destino);
    const qs = p.toString() ? '?' + p.toString() : '';
    setTurnos(null);
    api.turnos(qs).then(setTurnos).catch(() => setTurnos([]));
  };
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  // agrupa por ruta
  const grupos = {};
  (turnos || []).forEach((t) => { const k = `${t.origen} → ${t.destino}`; (grupos[k] ||= []).push(t); });

  return (
    <div className="container">
      <h1 className="h-title">Turnos de transporte</h1>
      <p className="h-sub">Consulta a qué hora pasa un turno hacia tu destino.</p>

      <div style={{ display: 'flex', gap: 8 }}>
        <input className="search" style={{ flex: 1 }} placeholder="Origen (ej. Guaranda)" value={origen} onChange={(e) => setOrigen(e.target.value)} />
        <input className="search" style={{ flex: 1 }} placeholder="Destino (ej. Babahoyo)" value={destino} onChange={(e) => setDestino(e.target.value)} />
      </div>
      <button className="btn grad block" style={{ marginTop: 10 }} onClick={cargar}>Buscar turnos</button>

      {!turnos ? <Loader /> : Object.keys(grupos).length === 0 ? <Vacio>No hay turnos para esa búsqueda.</Vacio> : (
        Object.entries(grupos).map(([ruta, items]) => (
          <div className="ruta" key={ruta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}><Bus size={18} /> {ruta}</div>
            {items.map((t) => {
              const wa = waHref(t.whatsapp, `Hola, consulto por el turno ${t.origen}-${t.destino} de las ${String(t.hora).slice(0,5)}.`);
              const tel = telHref(t.telefono);
              return (
                <div className="turno" key={t.id}>
                  <span className="hora">{String(t.hora).slice(0, 5)}</span>
                  <div className="grow" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{t.cooperativa}</div>
                    <div className="muted">{t.dias}{t.nota ? ' · ' + t.nota : ''}</div>
                  </div>
                  {wa && <a className="btn wa" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} /></a>}
                  {tel && <a className="btn grad" href={tel}><Phone size={16} /></a>}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

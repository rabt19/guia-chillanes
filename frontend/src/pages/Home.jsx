import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { CatIcon, Search, Loader, Vacio } from '../components/ui.jsx';
import BusinessCard from '../components/BusinessCard.jsx';

export default function Home() {
  const [cats, setCats] = useState(null);
  const [destacados, setDestacados] = useState([]);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.categorias().then(setCats).catch(() => setCats([]));
    api.negocios('?').then((n) => setDestacados(n.filter((x) => x.destacado).slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => {
    if (texto.trim().length < 2) { setResultados(null); return; }
    const t = setTimeout(() => {
      api.negocios('?q=' + encodeURIComponent(texto.trim())).then(setResultados).catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  return (
    <div className="container">
      <h1 className="h-title">Descubre Chillanes</h1>
      <p className="h-sub">Negocios, transporte y servicios, a un toque de distancia.</p>

      <div className="search">
        <Search size={18} />
        <input placeholder="Buscar un negocio, comida, servicio…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>

      {resultados !== null ? (
        <>
          <h2 className="h-title" style={{ fontSize: 18, marginTop: 20 }}>Resultados</h2>
          {resultados.length === 0 ? <Vacio>No se encontraron negocios.</Vacio>
            : <div className="list">{resultados.map((n) => <BusinessCard key={n.id} n={n} onClick={() => nav('/n/' + n.id)} />)}</div>}
        </>
      ) : (
        <>
          {!cats ? <Loader /> : (
            <div className="cat-grid">
              {cats.map((c) => (
                <Link key={c.id} to={'/c/' + c.slug} className="cat-card">
                  <span className="cat-ico"><CatIcon name={c.icono} /></span>
                  <span className="nom">{c.nombre}</span>
                </Link>
              ))}
            </div>
          )}

          {destacados.length > 0 && (
            <>
              <h2 className="h-title" style={{ fontSize: 18, marginTop: 24 }}>Destacados</h2>
              <div className="list">
                {destacados.map((n) => <BusinessCard key={n.id} n={n} onClick={() => nav('/n/' + n.id)} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

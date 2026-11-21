import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Loader, Vacio } from '../components/ui.jsx';
import BusinessCard from '../components/BusinessCard.jsx';

export default function Categoria() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [cat, setCat] = useState(null);
  const [negs, setNegs] = useState(null);

  useEffect(() => {
    api.categorias().then((cs) => setCat(cs.find((c) => c.slug === slug) || { nombre: slug }));
    setNegs(null);
    api.negocios('?categoria=' + encodeURIComponent(slug)).then(setNegs).catch(() => setNegs([]));
  }, [slug]);

  return (
    <div className="container">
      <h1 className="h-title">{cat?.nombre || '…'}</h1>
      <p className="h-sub">{negs ? `${negs.length} negocio(s)` : 'Cargando…'}</p>
      {!negs ? <Loader /> : negs.length === 0
        ? <Vacio>Aún no hay negocios en esta categoría.</Vacio>
        : <div className="list">{negs.map((n) => <BusinessCard key={n.id} n={n} onClick={() => nav('/n/' + n.id)} />)}</div>}
    </div>
  );
}

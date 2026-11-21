import { Shield, MessageCircle } from 'lucide-react';
import { waHref } from '../components/ui.jsx';

// Fase 2: consulta de trámites al GAD por WhatsApp. Por ahora, enlace directo.
const NUMERO_GAD = ''; // ej. '032978000' — configúralo cuando esté listo

export default function Gad() {
  const wa = waHref(NUMERO_GAD, 'Hola, deseo consultar el estado de un trámite en el GAD de Chillanes.');
  return (
    <div className="container">
      <h1 className="h-title">Ventanilla GAD</h1>
      <p className="h-sub">Consulta tus trámites con el GAD Municipal de Chillanes.</p>
      <div className="card"><div className="body center">
        <div className="cat-ico" style={{ margin: '6px auto 12px' }}><Shield size={24} /></div>
        <p className="muted">
          Pronto podrás consultar aquí el estado de tus trámites y recibir respuesta por WhatsApp,
          sin tener que acercarte a ventanilla.
        </p>
        {wa
          ? <a className="btn wa block" href={wa} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}><MessageCircle size={18} /> Escribir al GAD</a>
          : <p className="muted" style={{ marginTop: 12 }}>En preparación (fase 2).</p>}
      </div></div>
    </div>
  );
}

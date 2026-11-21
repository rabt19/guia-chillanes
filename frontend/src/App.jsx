import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Categoria from './pages/Categoria.jsx';
import NegocioDetalle from './pages/NegocioDetalle.jsx';
import Transporte from './pages/Transporte.jsx';
import Gad from './pages/Gad.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Cuenta from './pages/Cuenta.jsx';
import Admin from './pages/Admin.jsx';

function Privada({ children, admin }) {
  const { user, cargando, esAdmin } = useAuth();
  if (cargando) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !esAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:slug" element={<Categoria />} />
        <Route path="/n/:id" element={<NegocioDetalle />} />
        <Route path="/transporte" element={<Transporte />} />
        <Route path="/gad" element={<Gad />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/cuenta" element={<Privada><Cuenta /></Privada>} />
        <Route path="/admin" element={<Privada admin><Admin /></Privada>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

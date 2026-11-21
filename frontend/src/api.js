// Cliente simple hacia el gateway. VITE_API_URL se define en build (Vercel) o .env.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

function token() { return localStorage.getItem('gc_token') || ''; }

async function req(path, { method = 'GET', body, auth = false, form = false } = {}) {
  const headers = {};
  if (!form) headers['Content-Type'] = 'application/json';
  if (auth && token()) headers['Authorization'] = `Bearer ${token()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

// convierte rutas de foto relativas (/api/..) a absolutas del gateway
export const fotoUrl = (u) => (!u ? '' : u.startsWith('http') ? u : BASE + u);

export const api = {
  base: BASE,
  // auth
  register: (b) => req('/api/auth/register', { method: 'POST', body: b }),
  login: (b) => req('/api/auth/login', { method: 'POST', body: b }),
  login2fa: (b) => req('/api/auth/login/2fa', { method: 'POST', body: b }),
  me: () => req('/api/auth/me', { auth: true }),
  setup2fa: () => req('/api/auth/2fa/setup', { method: 'POST', auth: true }),
  enable2fa: (code) => req('/api/auth/2fa/enable', { method: 'POST', body: { code }, auth: true }),
  disable2fa: (code) => req('/api/auth/2fa/disable', { method: 'POST', body: { code }, auth: true }),
  // negocios
  categorias: () => req('/api/negocios/categorias'),
  negocios: (qs = '') => req('/api/negocios/negocios' + qs),
  negocio: (id) => req('/api/negocios/negocios/' + id),
  crearNegocio: (b) => req('/api/negocios/negocios', { method: 'POST', body: b, auth: true }),
  editarNegocio: (id, b) => req('/api/negocios/negocios/' + id, { method: 'PUT', body: b, auth: true }),
  borrarNegocio: (id) => req('/api/negocios/negocios/' + id, { method: 'DELETE', auth: true }),
  subirFoto: (file) => { const fd = new FormData(); fd.append('foto', file);
    return req('/api/negocios/upload', { method: 'POST', body: fd, auth: true, form: true }); },
  // transporte
  turnos: (qs = '') => req('/api/transporte/turnos' + qs),
  rutas: () => req('/api/transporte/rutas'),
  crearTurno: (b) => req('/api/transporte/turnos', { method: 'POST', body: b, auth: true }),
  borrarTurno: (id) => req('/api/transporte/turnos/' + id, { method: 'DELETE', auth: true }),
};

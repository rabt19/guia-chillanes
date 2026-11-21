import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;
// Acepta "host" o "http(s)://host[:puerto]". Si no trae esquema, asume https
// (en Render el gateway llama a las URLs públicas de cada servicio).
const url = (v, def) => {
  const s = (v || def).trim();
  return /^https?:\/\//.test(s) ? s : 'https://' + s;
};
const AUTH = url(process.env.AUTH_URL, 'http://localhost:4001');
const NEGOCIOS = url(process.env.NEGOCIOS_URL, 'http://localhost:4002');
const TRANSPORTE = url(process.env.TRANSPORTE_URL, 'http://localhost:4003');

app.get('/health', (_req, res) => res.json({ ok: true, service: 'gateway' }));

// Enruta cada prefijo a su microservicio y le quita el prefijo del path.
const route = (prefix, target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${prefix}`), '') || '/',
  });

app.use('/api/auth', route('/api/auth', AUTH));
app.use('/api/negocios', route('/api/negocios', NEGOCIOS));
app.use('/api/transporte', route('/api/transporte', TRANSPORTE));

app.listen(PORT, () => console.log(`gateway en ${PORT} -> auth:${AUTH} negocios:${NEGOCIOS} transporte:${TRANSPORTE}`));

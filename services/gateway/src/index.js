import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;
const AUTH = process.env.AUTH_URL || 'http://localhost:4001';
const NEGOCIOS = process.env.NEGOCIOS_URL || 'http://localhost:4002';
const TRANSPORTE = process.env.TRANSPORTE_URL || 'http://localhost:4003';

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

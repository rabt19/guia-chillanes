import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { q, pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const PORT = process.env.PORT || 4002;
const UPLOAD_DIR = '/data/uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// fotos servidas de forma estática (el gateway las expone en /api/negocios/uploads/..)
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- auth: solo admin puede escribir ---------------------------------------
function admin(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'No autenticado' });
  try {
    const p = jwt.verify(t, JWT_SECRET);
    if (p.rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador' });
    req.user = p; next();
  } catch { return res.status(401).json({ error: 'Sesión inválida' }); }
}

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, UPLOAD_DIR),
  filename: (_r, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().slice(0, 5);
    cb(null, crypto.randomUUID() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => cb(null, /image\/(jpe?g|png|webp|gif)/.test(file.mimetype)),
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'negocios' }));

// ---- categorías (lectura pública) ------------------------------------------
app.get('/categorias', async (_req, res) => {
  const { rows } = await q("SELECT * FROM categorias WHERE estado='A' ORDER BY orden, nombre");
  res.json(rows);
});

// ---- negocios (lectura pública, con filtros) -------------------------------
app.get('/negocios', async (req, res) => {
  const { categoria, q: texto } = req.query;
  const where = ["n.estado='A'"]; const args = [];
  if (categoria) { args.push(categoria); where.push(`c.slug = $${args.length}`); }
  if (texto) { args.push(`%${String(texto).toLowerCase()}%`);
    where.push(`(lower(n.nombre) LIKE $${args.length} OR lower(coalesce(n.propietario,'')) LIKE $${args.length} OR lower(coalesce(n.descripcion,'')) LIKE $${args.length})`); }
  const { rows } = await q(
    `SELECT n.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug, c.icono AS categoria_icono
       FROM negocios n JOIN categorias c ON c.id = n.id_categoria
      WHERE ${where.join(' AND ')}
      ORDER BY n.destacado DESC, n.nombre`, args);
  res.json(rows);
});

app.get('/negocios/:id', async (req, res) => {
  const { rows } = await q(
    `SELECT n.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug
       FROM negocios n JOIN categorias c ON c.id=n.id_categoria WHERE n.id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
});

// ---- escritura (solo admin) ------------------------------------------------
const campos = ['id_categoria','nombre','propietario','descripcion','telefono','whatsapp','direccion','referencia','foto_url','destacado','estado'];
const tomar = (b) => campos.reduce((o,k)=> (b[k] !== undefined ? (o[k]=b[k], o) : o), {});

app.post('/negocios', admin, async (req, res) => {
  const d = tomar(req.body);
  if (!d.id_categoria || !d.nombre) return res.status(400).json({ error: 'Categoría y nombre son obligatorios' });
  const cols = Object.keys(d), vals = Object.values(d);
  const ph = cols.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await q(`INSERT INTO negocios (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals);
  res.status(201).json(rows[0]);
});

app.put('/negocios/:id', admin, async (req, res) => {
  const d = tomar(req.body);
  d.actualizado = new Date();
  const cols = Object.keys(d), vals = Object.values(d);
  const set = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
  vals.push(req.params.id);
  const { rows } = await q(`UPDATE negocios SET ${set} WHERE id=$${vals.length} RETURNING *`, vals);
  if (!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
});

app.delete('/negocios/:id', admin, async (req, res) => {
  await q("UPDATE negocios SET estado='I' WHERE id=$1", [req.params.id]);  // baja lógica
  res.json({ ok: true });
});

// subir foto -> devuelve la ruta pública para guardar en foto_url
app.post('/upload', admin, upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagen inválida (jpg, png, webp; máx 4MB)' });
  res.json({ foto_url: `/api/negocios/uploads/${req.file.filename}` });
});

// ---- categorías: alta/edición (solo admin) ---------------------------------
app.post('/categorias', admin, async (req, res) => {
  const { nombre, slug, icono = 'store', orden = 0 } = req.body;
  if (!nombre || !slug) return res.status(400).json({ error: 'Nombre y slug obligatorios' });
  const { rows } = await q('INSERT INTO categorias (nombre,slug,icono,orden) VALUES ($1,$2,$3,$4) RETURNING *',
    [nombre, slug, icono, orden]);
  res.status(201).json(rows[0]);
});

async function start() {
  for (let i = 0; i < 20; i++) { try { await pool.query('SELECT 1'); break; } catch { await new Promise(r=>setTimeout(r,1500)); } }
  app.listen(PORT, () => console.log(`negocios-service en ${PORT}`));
}
start();

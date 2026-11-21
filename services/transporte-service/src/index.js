import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { q, pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const PORT = process.env.PORT || 4003;

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

app.get('/health', (_req, res) => res.json({ ok: true, service: 'transporte' }));

// listado público, opcional por origen/destino
app.get('/turnos', async (req, res) => {
  const { origen, destino } = req.query;
  const where = ["estado='A'"]; const args = [];
  if (origen) { args.push(`%${String(origen).toLowerCase()}%`); where.push(`lower(origen) LIKE $${args.length}`); }
  if (destino) { args.push(`%${String(destino).toLowerCase()}%`); where.push(`lower(destino) LIKE $${args.length}`); }
  const { rows } = await q(
    `SELECT * FROM transporte_turnos WHERE ${where.join(' AND ')} ORDER BY origen, destino, hora`, args);
  res.json(rows);
});

// rutas únicas (para armar el selector origen -> destino)
app.get('/rutas', async (_req, res) => {
  const { rows } = await q(
    "SELECT origen, destino, count(*)::int AS turnos FROM transporte_turnos WHERE estado='A' GROUP BY origen, destino ORDER BY origen, destino");
  res.json(rows);
});

const campos = ['cooperativa','origen','destino','hora','dias','telefono','whatsapp','nota','estado'];
const tomar = (b) => campos.reduce((o,k)=> (b[k] !== undefined ? (o[k]=b[k], o) : o), {});

app.post('/turnos', admin, async (req, res) => {
  const d = tomar(req.body);
  if (!d.cooperativa || !d.origen || !d.destino || !d.hora)
    return res.status(400).json({ error: 'Cooperativa, origen, destino y hora son obligatorios' });
  const cols = Object.keys(d), vals = Object.values(d);
  const ph = cols.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await q(`INSERT INTO transporte_turnos (${cols.join(',')}) VALUES (${ph}) RETURNING *`, vals);
  res.status(201).json(rows[0]);
});

app.put('/turnos/:id', admin, async (req, res) => {
  const d = tomar(req.body);
  const cols = Object.keys(d), vals = Object.values(d);
  const set = cols.map((c, i) => `${c}=$${i + 1}`).join(',');
  vals.push(req.params.id);
  const { rows } = await q(`UPDATE transporte_turnos SET ${set} WHERE id=$${vals.length} RETURNING *`, vals);
  if (!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
});

app.delete('/turnos/:id', admin, async (req, res) => {
  await q("UPDATE transporte_turnos SET estado='I' WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

async function start() {
  for (let i = 0; i < 20; i++) { try { await pool.query('SELECT 1'); break; } catch { await new Promise(r=>setTimeout(r,1500)); } }
  app.listen(PORT, () => console.log(`transporte-service en ${PORT}`));
}
start();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { q, pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ISSUER = process.env.TOTP_ISSUER || 'Guia Chillanes';
const PORT = process.env.PORT || 4001;

// ---- helpers ---------------------------------------------------------------
const publicUser = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, totp_activo: u.totp_activo });
const sign = (u) => jwt.sign({ sub: u.id, rol: u.rol, nombre: u.nombre }, JWT_SECRET, { expiresIn: '7d' });
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'No autenticado' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Sesión inválida o expirada' }); }
}

// ---- rutas -----------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true, service: 'auth' }));

// Registro (rol usuario). La contraseña se guarda con bcrypt.
app.post('/register', async (req, res) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!nombre || !emailOk(email)) return res.status(400).json({ error: 'Nombre y correo válidos son obligatorios' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

    const dup = await q('SELECT 1 FROM usuarios WHERE email=$1', [email]);
    if (dup.rowCount) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await q(
      'INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, email, hash, 'usuario']
    );
    const u = rows[0];
    res.status(201).json({ token: sign(u), user: publicUser(u) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al registrar' }); }
});

// Login paso 1: usuario + contraseña
app.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const { rows } = await q('SELECT * FROM usuarios WHERE email=$1 AND estado=$2', [email, 'A']);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash)))
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    if (u.totp_activo) {
      // token temporal (5 min) que certifica que la contraseña pasó; falta el 2FA
      const pendingToken = jwt.sign({ sub: u.id, stage: '2fa' }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ need2fa: true, pendingToken });
    }
    res.json({ token: sign(u), user: publicUser(u) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al iniciar sesión' }); }
});

// Login paso 2: código del 2FA
app.post('/login/2fa', async (req, res) => {
  try {
    const { pendingToken, code } = req.body;
    let payload;
    try { payload = jwt.verify(pendingToken, JWT_SECRET); } catch { return res.status(401).json({ error: 'El paso previo expiró, inicie sesión de nuevo' }); }
    if (payload.stage !== '2fa') return res.status(400).json({ error: 'Token inválido' });

    const { rows } = await q('SELECT * FROM usuarios WHERE id=$1', [payload.sub]);
    const u = rows[0];
    if (!u || !u.totp_secret) return res.status(400).json({ error: 'El 2FA no está configurado' });
    if (!authenticator.check(String(code || '').trim(), u.totp_secret))
      return res.status(401).json({ error: 'Código de verificación incorrecto' });

    res.json({ token: sign(u), user: publicUser(u) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error al verificar el código' }); }
});

app.get('/me', auth, async (req, res) => {
  const { rows } = await q('SELECT * FROM usuarios WHERE id=$1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'No existe' });
  res.json({ user: publicUser(rows[0]) });
});

// 2FA paso 1: generar secreto + QR (todavía no se activa)
app.post('/2fa/setup', auth, async (req, res) => {
  const { rows } = await q('SELECT * FROM usuarios WHERE id=$1', [req.user.sub]);
  const u = rows[0];
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(u.email, ISSUER, secret);
  const qr = await QRCode.toDataURL(otpauth);
  // se guarda el secreto pero inactivo hasta que confirme con un código válido
  await q('UPDATE usuarios SET totp_secret=$1, totp_activo=FALSE WHERE id=$2', [secret, u.id]);
  res.json({ secret, otpauth, qr });
});

// 2FA paso 2: confirmar el código y activar
app.post('/2fa/enable', auth, async (req, res) => {
  const { rows } = await q('SELECT * FROM usuarios WHERE id=$1', [req.user.sub]);
  const u = rows[0];
  if (!u.totp_secret) return res.status(400).json({ error: 'Primero genere el código QR' });
  if (!authenticator.check(String(req.body.code || '').trim(), u.totp_secret))
    return res.status(401).json({ error: 'Código incorrecto, intente de nuevo' });
  await q('UPDATE usuarios SET totp_activo=TRUE WHERE id=$1', [u.id]);
  res.json({ ok: true, totp_activo: true });
});

// Desactivar 2FA (requiere código vigente)
app.post('/2fa/disable', auth, async (req, res) => {
  const { rows } = await q('SELECT * FROM usuarios WHERE id=$1', [req.user.sub]);
  const u = rows[0];
  if (u.totp_activo && !authenticator.check(String(req.body.code || '').trim(), u.totp_secret || ''))
    return res.status(401).json({ error: 'Código incorrecto' });
  await q('UPDATE usuarios SET totp_secret=NULL, totp_activo=FALSE WHERE id=$1', [u.id]);
  res.json({ ok: true, totp_activo: false });
});

// ---- bootstrap del administrador (desde variables de entorno) --------------
async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  if (!email || !password) return;
  // La clave de ADMIN_PASSWORD es la fuente de verdad: si el admin ya existe,
  // se sincroniza su contraseña (así cambiarla en Render sí tiene efecto).
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await q('SELECT id FROM usuarios WHERE email=$1', [email]);
  if (rows[0]) {
    await q("UPDATE usuarios SET rol='admin', password_hash=$2 WHERE email=$1", [email, hash]);
    console.log('Administrador actualizado (clave sincronizada con ADMIN_PASSWORD):', email);
  } else {
    await q('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES ($1,$2,$3,$4)', [nombre, email, hash, 'admin']);
    console.log('Administrador creado:', email);
  }
}

// aplica el esquema (idempotente) — necesario en bases gestionadas donde no corre docker-initdb
async function migrar() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Esquema aplicado/verificado');
  } catch (e) { console.error('migrar', e.message); }
}

async function start() {
  // espera activa simple a que Postgres esté listo
  for (let i = 0; i < 20; i++) {
    try { await pool.query('SELECT 1'); break; }
    catch { await new Promise(r => setTimeout(r, 1500)); }
  }
  await migrar();
  await bootstrapAdmin().catch(e => console.error('bootstrapAdmin', e.message));
  app.listen(PORT, () => console.log(`auth-service en ${PORT}`));
}
start();

import pg from 'pg';

// SSL automático cuando la base es gestionada (Neon/Render/Railway).
const url = process.env.DATABASE_URL || '';
const needSSL = /sslmode=require/.test(url) || process.env.PGSSL === 'true';

export const pool = new pg.Pool({
  connectionString: url,
  ssl: needSSL ? { rejectUnauthorized: false } : undefined,
});

export const q = (text, params) => pool.query(text, params);

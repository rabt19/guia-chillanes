import pg from 'pg';

// Pool de conexiones a Postgres. DATABASE_URL viene del entorno (docker-compose / Render).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const q = (text, params) => pool.query(text, params);

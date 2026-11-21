-- ============================================================================
-- Guía Chillanes — esquema de base de datos (Postgres)
-- Se ejecuta automáticamente al crear el contenedor de Postgres (docker-entrypoint-initdb.d)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Usuarios (autenticación, 2FA)
--   rol: 'admin' administra todo; 'usuario' solo consulta
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    rol           VARCHAR(20)  NOT NULL DEFAULT 'usuario'
                    CHECK (rol IN ('admin','usuario')),
    totp_secret   VARCHAR(120),            -- secreto base32 del 2FA (null = sin 2FA)
    totp_activo   BOOLEAN NOT NULL DEFAULT FALSE,
    estado        VARCHAR(1)  NOT NULL DEFAULT 'A' CHECK (estado IN ('A','I')),
    creado        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Categorías (restaurantes, camionetas, delivery, transporte, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(80)  NOT NULL UNIQUE,
    slug     VARCHAR(80)  NOT NULL UNIQUE,
    icono    VARCHAR(40)  NOT NULL DEFAULT 'store',   -- nombre de icono
    orden    INT          NOT NULL DEFAULT 0,
    estado   VARCHAR(1)   NOT NULL DEFAULT 'A' CHECK (estado IN ('A','I'))
);

-- ----------------------------------------------------------------------------
-- Negocios / contactos (cada ficha de la guía)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negocios (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_categoria INT NOT NULL REFERENCES categorias(id),
    nombre       VARCHAR(140) NOT NULL,          -- nombre comercial
    propietario  VARCHAR(140),                   -- nombre del contacto/propietario
    descripcion  VARCHAR(500),
    telefono     VARCHAR(30),                    -- número de contacto
    whatsapp     VARCHAR(30),                    -- número para wa.me (solo dígitos, con 593)
    direccion    VARCHAR(200),
    referencia   VARCHAR(200),                   -- p. ej. "de Guaranda a Babahoyo"
    foto_url     VARCHAR(300),                   -- imagen del local/contacto
    destacado    BOOLEAN NOT NULL DEFAULT FALSE,
    estado       VARCHAR(1) NOT NULL DEFAULT 'A' CHECK (estado IN ('A','I')),
    creado       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_negocios_categoria ON negocios(id_categoria);
CREATE INDEX IF NOT EXISTS ix_negocios_estado    ON negocios(estado);

-- ----------------------------------------------------------------------------
-- Fotos (se guardan en la base para que persistan en hosting sin disco)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS negocio_fotos (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mime   VARCHAR(40) NOT NULL,
    datos  BYTEA       NOT NULL,
    creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Turnos de transporte (cooperativas: ruta, horarios, contacto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transporte_turnos (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperativa  VARCHAR(140) NOT NULL,
    origen       VARCHAR(100) NOT NULL,
    destino      VARCHAR(100) NOT NULL,
    hora         TIME         NOT NULL,
    dias         VARCHAR(40)  NOT NULL DEFAULT 'L-D',   -- días que opera
    telefono     VARCHAR(30),
    whatsapp     VARCHAR(30),
    nota         VARCHAR(200),
    estado       VARCHAR(1) NOT NULL DEFAULT 'A' CHECK (estado IN ('A','I'))
);
CREATE INDEX IF NOT EXISTS ix_turnos_ruta ON transporte_turnos(origen, destino);

-- ----------------------------------------------------------------------------
-- Datos iniciales (categorías base y un turno de ejemplo)
-- ----------------------------------------------------------------------------
INSERT INTO categorias (nombre, slug, icono, orden) VALUES
    ('Restaurantes',          'restaurantes',  'utensils', 1),
    ('Camionetas',            'camionetas',    'truck',    2),
    ('Delivery',              'delivery',      'bike',     3),
    ('Transporte',            'transporte',    'bus',      4),
    ('Tiendas y abarrotes',   'tiendas',       'store',    5),
    ('Salud',                 'salud',         'heart',    6),
    ('Servicios',             'servicios',     'wrench',   7)
ON CONFLICT (slug) DO NOTHING;

-- turnos de ejemplo: solo la primera vez (la tabla no tiene índice único)
INSERT INTO transporte_turnos (cooperativa, origen, destino, hora, dias, nota)
SELECT * FROM (VALUES
    ('Coop. Flota Bolívar', 'Guaranda', 'Babahoyo', '06:00'::time, 'L-D', 'Pasa por Chillanes'),
    ('Coop. Flota Bolívar', 'Guaranda', 'Babahoyo', '14:00'::time, 'L-D', 'Pasa por Chillanes')
) AS v(cooperativa, origen, destino, hora, dias, nota)
WHERE NOT EXISTS (SELECT 1 FROM transporte_turnos);

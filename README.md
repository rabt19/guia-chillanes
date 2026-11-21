# Guía Chillanes

Directorio y guía comercial de **Chillanes** en forma de **PWA** (aplicación web instalable): negocios por categorías (restaurantes, camionetas, delivery, tiendas, salud, servicios), **turnos de transporte** y una futura **ventanilla de consultas al GAD**. Cada negocio tiene foto, contacto y botón directo de **WhatsApp**.

- **Frontend:** React + Vite (PWA), desplegable en **Vercel**.
- **Backend:** microservicios Node/Express en **contenedores Docker** + **Postgres**.
- **Seguridad:** registro con contraseña (bcrypt), sesión con JWT y **verificación en dos pasos (2FA)** por aplicación (Google Authenticator / Authy).
- **Admin:** solo el administrador gestiona el contenido; el resto consulta.

## Arquitectura

```
        React PWA (Vercel)
                |
          API Gateway (8080)
        /       |         \
   auth     negocios    transporte     <- cada uno un contenedor
        \       |         /
            Postgres (volumen = respaldo)   +  volumen de fotos (uploads)
```

| Servicio | Carpeta | Hace |
|---|---|---|
| gateway | `services/gateway` | Une todo en una sola URL (`/api/...`) |
| auth-service | `services/auth-service` | Registro, login, 2FA (TOTP) |
| negocios-service | `services/negocios-service` | Categorías, negocios, subida de fotos |
| transporte-service | `services/transporte-service` | Turnos de transporte |
| postgres | (imagen oficial) | Base de datos |

## Cómo correrlo en local (todo en contenedores)

Requisitos: Docker + Docker Compose.

```bash
cp .env.example .env            # edita las claves (JWT_SECRET, ADMIN_*, POSTGRES_PASSWORD)
docker compose up --build       # levanta base + microservicios + gateway
```

- API disponible en `http://localhost:8080` (prueba `http://localhost:8080/health`).
- La base se crea sola con las categorías de ejemplo (`db/init/01_schema.sql`).
- El **administrador** se crea con las variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

El **frontend** se corre aparte:

```bash
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:8080
npm install
npm run dev                     # abre http://localhost:5173
```

## Respaldo

Todo el estado vive en dos volúmenes de Docker:
- `pgdata` → la base de datos.
- `uploads` → las fotos.

Respaldo de la base:
```bash
docker compose exec postgres pg_dump -U guia guia_chillanes > respaldo_$(date +%F).sql
```

## Despliegue (gratis)

- **Frontend → Vercel:** importa el repo, raíz `frontend/`. Define `VITE_API_URL` con la URL pública del gateway. `vercel.json` ya maneja las rutas de la SPA.
- **Backend → Render o Railway:** despliega con el `docker-compose.yml` (o cada servicio como contenedor). Usa un Postgres gestionado (Render/Neon/Supabase) y pon su `DATABASE_URL` en las variables.

## Fase 2 (planeado)

- **Ventanilla GAD:** consulta del estado de trámites por WhatsApp (bot con WhatsApp Business API), uniendo lo público y lo privado.
- Reseñas y calificaciones, mapa, y panel de estadísticas.

## Seguridad

- Contraseñas con **bcrypt** (nunca en texto plano).
- Sesiones con **JWT** firmado (`JWT_SECRET`).
- **2FA TOTP** opcional por cuenta; obligatorio recomendado para el administrador.
- Escritura protegida por rol **admin**; lectura pública.
- No subas `.env` al repositorio (ya está en `.gitignore`).

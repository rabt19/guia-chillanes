# Despliegue de Guía Chillanes

Dos partes: **backend** (Render) y **frontend** (Vercel). Hazlo en este orden.

## 1) Backend en Render (gratis)

1. Entra a <https://render.com> e inicia sesión con GitHub (cuenta rabt19).
2. **New > Blueprint** → elige el repo `guia-chillanes`. Render leerá `render.yaml`.
3. Render creará: la base `guia-db` y los servicios `auth-service`, `negocios-service`, `transporte-service` y `gateway`.
4. En **auth-service → Environment**, completa:
   - `ADMIN_EMAIL` = rabt19@gmail.com
   - `ADMIN_PASSWORD` = (una clave fuerte)
5. Da **Apply**. Espera a que todos queden en verde (la primera vez tarda).
6. Copia la URL pública del **gateway** (algo como `https://gateway-xxxx.onrender.com`).
   Pruébala: `https://gateway-xxxx.onrender.com/health` debe responder `{"ok":true}`.

> El plan free duerme tras 15 min sin uso; el primer acceso tarda ~1 minuto en despertar.
> La base free de Render dura 30 días; para una gratuita permanente, crea un Postgres en
> **Neon** (<https://neon.tech>) y pon su `DATABASE_URL` (con `?sslmode=require`) en los 3 servicios.

## 2) Frontend en Vercel (gratis)

1. Entra a <https://vercel.com> con GitHub.
2. **Add New > Project** → importa `guia-chillanes`.
3. En **Root Directory** elige `frontend`.
4. En **Environment Variables** agrega:
   - `VITE_API_URL` = la URL del gateway de Render (paso 1.6).
5. **Deploy**. Vercel te dará la URL pública (p. ej. `https://guia-chillanes.vercel.app`).
6. La app es una **PWA**: en el celular, "Agregar a pantalla de inicio" la instala.

## Actualizar

- Cada `git push` a `main` redepliega solo (Render y Vercel observan el repo).

## Respaldo de la base

```bash
# local
docker compose exec postgres pg_dump -U guia guia_chillanes > respaldo_$(date +%F).sql
# Render: usa el botón de backups del Postgres, o pg_dump con la External Database URL
```

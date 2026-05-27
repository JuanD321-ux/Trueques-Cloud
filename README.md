# Trueques Comunitarios

Módulo de trueques del proyecto **Nodo Travesías**. Permite publicar productos, crear solicitudes de intercambio y consultar trueques. Usa **Node.js + Express**, **React + Vite** y **PostgreSQL**.

> Este módulo **no tiene login propio**. El login lo hace el `auth-service`; Trueques solo valida el token JWT usando el mismo `JWT_SECRET`.

---

## 1. Requisitos

- Node.js
- PostgreSQL
- Base de datos local: `trueques_db`
- Backend en puerto `3003`

---

## 2. Configurar variables de entorno

El backend lee su configuración desde:

```bash
backend/.env
```

Ese archivo es privado y **no se sube a GitHub**. Para crearlo localmente, copia la plantilla:

```bash
cp backend/.env.local.example backend/.env
```

Ejemplo local:

```env
PORT=3003
JWT_SECRET=59faef09023ed861343bea7461f100a1d481f58e279d382b8102ac803e9951d1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=trueques_db
DB_USER=postgres
DB_PASS=1234

ALLOW_DEV_TOKEN=true
```

Para servidor, Iker debe crear el `.env` real usando la plantilla:

```bash
backend/.env.server.example
```

Ejemplo servidor:

```env
PORT=3003
JWT_SECRET=59faef09023ed861343bea7461f100a1d481f58e279d382b8102ac803e9951d1

DB_HOST=nodo-postgres
DB_PORT=5432
DB_NAME=trueques_db
DB_USER=nodo_admin
DB_PASS=contraseña_real_servidor

ALLOW_DEV_TOKEN=false
```

Importante: Trueques usa la base `trueques_db`. **No usa `db_auth`**; esa base pertenece al `auth-service`.

---

## 3. Crear la base de datos

En PostgreSQL crear la base:

```sql
CREATE DATABASE trueques_db;
```

Luego ejecutar el script principal:

```bash
backend/database/001_schema_postgres.sql
```

Si la base ya existía y solo se necesita adaptar al login central, ejecutar:

```bash
backend/database/002_upgrade_auth_integration.sql
```

La tabla local `usuario` usa el campo `auth_user_id` para relacionar el usuario del `auth-service` con el usuario local de Trueques.

---

## 4. Correr el backend localmente

```bash
cd backend
npm install
npm run dev
```

El backend queda en:

```bash
http://localhost:3003
```

Rutas rápidas de prueba:

```bash
GET http://localhost:3003/health
GET http://localhost:3003/probar-db
GET http://localhost:3003/productos
```

En local se puede generar un token de prueba con:

```bash
GET http://localhost:3003/dev-token
```

Ese modo solo debe usarse con:

```env
ALLOW_DEV_TOKEN=true
```

En servidor debe quedar en `false`.

---

## 5. Correr el frontend localmente

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en:

```bash
http://localhost:5173
```

Por defecto, en local el frontend consume:

```bash
http://localhost:3003
```

En servidor consume:

```bash
/api/trueques
```

Si se necesita cambiar la URL manualmente, crear un `.env` en `frontend` con:

```env
VITE_API_TRUEQUES_URL=http://localhost:3003
```

---

## 6. Integración con auth-service

Flujo esperado:

1. El usuario inicia sesión en el portal principal mediante `auth-service`.
2. El `auth-service` genera un JWT.
3. El frontend de Trueques lee el token del navegador.
4. El frontend envía el token al backend así:

```http
Authorization: Bearer TOKEN
```

5. El backend valida el token con `JWT_SECRET`.
6. Si el usuario no existe en la tabla local `usuario`, se crea automáticamente usando `auth_user_id`.
7. El usuario ya puede publicar productos, solicitar trueques y confirmar intercambios.

---

## 7. Integración en servidor con PostgreSQL y nginx

El contenedor del backend debe llamarse:

```bash
trueques-backend
```

Debe estar en la misma red de infraestructura:

```yaml
networks:
  nodo-network:
    external: true
    name: infra_default
```

En el `docker-compose.master.yml`, Trueques debe usar PostgreSQL, no MongoDB:

```yaml
trueques-backend:
  container_name: trueques-backend
  build:
    context: ../trueques/backend
  ports:
    - "3003:3003"
  environment:
    PORT: 3003
    JWT_SECRET: ${JWT_SECRET}
    DB_HOST: nodo-postgres
    DB_PORT: 5432
    DB_NAME: trueques_db
    DB_USER: ${POSTGRES_USER}
    DB_PASS: ${POSTGRES_PASSWORD}
    ALLOW_DEV_TOKEN: false
  networks:
    - nodo-network
  restart: unless-stopped
```

En nginx debe existir la ruta:

```nginx
location /api/trueques/ {
    set $upstream_trueques trueques-backend:3003;
    rewrite ^/api/trueques/(.*)$ /$1 break;
    proxy_pass http://$upstream_trueques;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

---

## 8. Archivos que no se deben subir

No subir:

```bash
backend/.env
frontend/.env
node_modules/
dist/
*.log
```

Sí subir:

```bash
README.md
.gitignore
backend/package.json
backend/package-lock.json
backend/.env.local.example
backend/.env.server.example
backend/database/001_schema_postgres.sql
backend/database/002_upgrade_auth_integration.sql
backend/src/
frontend/package.json
frontend/package-lock.json
frontend/src/
frontend/public/
```

Antes de hacer commit, revisar:

```bash
git status --short
```

Si aparece `backend/.env`, `node_modules` o `dist`, no hacer commit hasta quitarlos del seguimiento.

---

## 9. Versión preparada para nube/repositorio

Esta versión incluye una alternativa de **login demo** para que el profesor o la comunidad pueda probar el sistema sin depender del `auth-service` original del servidor universitario.

### Cuentas demo

```txt
Usuario normal: usuario@demo.com / 123456
Administrador: admin@demo.com / admin123
```

El administrador demo puede eliminar publicaciones. El usuario normal puede publicar productos, solicitar trueques y consultar el historial.

### Despliegue recomendado

Se agregó `render.yaml` para desplegar en Render como una sola aplicación web con PostgreSQL. El backend Express también sirve el frontend React compilado, por lo que la URL pública abre directamente la interfaz.

Para más detalles revisar:

```bash
README_DEPLOY_CLOUD.md
```

### Cambios técnicos aplicados

- Login demo con JWT en `POST /api/trueques/auth/demo-login`.
- Alias de rutas `/api/trueques/...` para funcionar sin nginx.
- Express sirve `frontend/dist` en producción.
- Corrección del script SQL `001_schema_postgres.sql`.
- Plantillas `.env` actualizadas y seguras.

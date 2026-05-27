# Guía rápida para subir Trueques Comunitarios a la nube

Este paquete quedó preparado para probar el proyecto sin depender del servidor de la universidad ni del auth-service original.

## Cuentas demo para el profesor

- Usuario normal: `usuario@demo.com` / `123456`
- Administrador: `admin@demo.com` / `admin123`

El usuario normal puede publicar productos, solicitar trueques y consultar historial. El administrador además puede eliminar publicaciones.

## Opción recomendada: Render con PostgreSQL

1. Sube este proyecto limpio a GitHub.
2. En Render, crea un Blueprint usando el archivo `render.yaml` de la raíz.
3. Render crea dos recursos: una base PostgreSQL y un servicio web Node.
4. Cuando el backend esté activo, entra al Shell o consola de la base de datos y ejecuta:

```bash
psql "$DATABASE_URL" -f backend/database/001_schema_postgres.sql
```

Si no tienes Shell directo, abre la consola SQL de PostgreSQL y pega el contenido de:

```bash
backend/database/001_schema_postgres.sql
```

5. Abre la URL pública del servicio. La misma app sirve el frontend React y la API.

## Prueba local

### Base de datos

Crea la base:

```sql
CREATE DATABASE trueques_db;
```

Ejecuta:

```bash
psql -U postgres -d trueques_db -f backend/database/001_schema_postgres.sql
```

### Backend

```bash
cd backend
copy .env.local.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Abre:

```bash
http://localhost:5173
```

## Variables importantes

En producción usa estas variables:

```env
NODE_ENV=production
PORT=3003
JWT_SECRET=un_secreto_largo
DB_HOST=host_postgres
DB_PORT=5432
DB_NAME=trueques_db
DB_USER=usuario_postgres
DB_PASS=password_postgres
ALLOW_DEMO_LOGIN=true
ALLOW_DEV_TOKEN=false
```

## Qué se corrigió en esta versión

- Se eliminó `.git`, `node_modules`, `dist` y `.env` real del paquete final.
- Se agregó login demo con JWT para que el profesor pueda probar sin auth-service externo.
- Se corrigió un error de sintaxis en `001_schema_postgres.sql` dentro del trigger `actualizar_cantidad_productos`.
- Se agregaron rutas compatibles con `/api/trueques/...` para despliegues sin nginx.
- Se dejó Express listo para servir el frontend compilado de React desde el mismo servicio web.
- Se agregaron plantillas `.env` seguras y un `render.yaml` base para despliegue.

# Backend - Portal de Consulta de Políticas RRHH con RAG Multiagente (`TicoSoft S.A.`)

API REST construida con **Node.js, Express, Sequelize v6, MySQL, Google Drive API y Gemini (`@google/generative-ai`)**.

## Requisitos Previos
- Node.js 20+ (probado en Node 24)
- MySQL 8+ ejecutándose localmente (puerto `3306`)
- API Key de Google Gemini (`GEMINI_API_KEY`)
- Cuenta de servicio de Google Cloud con acceso de lectura a la carpeta de políticas en Google Drive (`backend/credenciales/*.json`)

## Instalación y Configuración
1. Instalar dependencias dentro de `backend/`:
   ```bash
   cd backend
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar credenciales reales:
   ```bash
   cp .env.example .env
   ```
   En Windows PowerShell también puedes usar `Copy-Item .env.example .env`. Luego coloca en `DB_USER` y `DB_PASSWORD` las credenciales de tu instalación local de MySQL.
   Variables principales:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `JWT_SECRET`, `CSRF_SECRET` (cadenas hexadecimales aleatorias de 64+ caracteres)
   - `FRONTEND_URL=http://localhost:5173`
   - `GEMINI_API_KEY=...`
   - `GEMINI_CHAT_MODEL=gemini-2.5-flash` (con fallback automático a modelos Flash activos)
   - `GEMINI_EMBEDDING_MODEL=gemini-embedding-001`
   - `RAG_SIMILARITY_THRESHOLD=0.65`
   - `GOOGLE_DRIVE_FOLDER_ID=1VMAZXbU6n86EEFWOa6ANFVqxDxscDK3O`
   - `GOOGLE_APPLICATION_CREDENTIALS=./credenciales/miniproyecto-515114-b12d28da88e8.json`

## Base de Datos MySQL (Migraciones y Seeder de 250 Colaboradores)
Todo el esquema relacional en **3FN** se gestiona únicamente mediante migraciones de Sequelize:
```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
Si tu usuario no tiene permiso para crear bases de datos, crea `rrhh_rag_db` desde MySQL Workbench o ejecuta `CREATE DATABASE rrhh_rag_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` y continúa con `db:migrate`.

### Cuentas Demo del Seed (Contraseña común: `DemoRRHH2026!`)
- **RRHH:** `ana.solis@ticosoft.cr`, `carlos.mora@ticosoft.cr`
- **Colaborador (24 días de vacaciones):** `diego.chaves@ticosoft.cr`
- **Colaborador (solicitud pendiente):** `laura.jimenez@ticosoft.cr`

## Ejecución del Servidor y Crones
```bash
npm run dev   # Desarrollo con nodemon en http://localhost:5000
npm start     # Producción
```
Al arrancar (`NODE_ENV !== 'test'`), se inicializan automáticamente:
- **Cron de Ingesta Google Drive:** todos los días a las **6:45 a. m.** (`America/Costa_Rica`).
- **Cron de Reporte Diario RRHH:** todos los días a las **7:00 a. m.** (`America/Costa_Rica`).

## Endpoints Principales
- **Salud y Auth:**
  - `GET /api/health`
  - `POST /api/auth/login`, `POST /api/auth/registro`, `GET /api/auth/yo`, `POST /api/auth/logout`, `GET /api/auth/usuarios-demo`
- **Ingesta Documental y RAG (`soloRol('rrhh')` para sync):**
  - `POST /api/ingest/sync` (sincronización incremental vía `drive.changes.list`)
  - `POST /api/ingest/sync-local` (indexación desde `documentos_drive/`)
  - `GET /api/ingest/status`
- **Chat Multiagente y Portal Colaborador:**
  - `POST /api/chat`, `GET /api/chat/history`
  - `GET /api/employee/me/summary`, `POST /api/attendance/check-in`
  - `GET /api/requests`, `POST /api/requests`, `PATCH /api/requests/:id` (`soloRol('rrhh')`)
- **Reportes Analíticos y Tickets (`soloRol('rrhh')`):**
  - `GET /api/reports/daily?fecha=YYYY-MM-DD`
  - `POST /api/reports/run-now`
  - `GET /api/reports/tickets`

## Auditoría y Evaluación del Banco de 45 Preguntas
- Linter arquitectónico de `backend-postgres-guardian`:
  ```bash
  node ../.agents/skills/backend-postgres-guardian/scripts/lint-backend.js .
  ```
- Evaluación automatizada del banco de 45 preguntas (genera `backend/docs_evaluacion/evaluacion_45_preguntas.md` y `.json`):
  ```bash
  npm run eval:45
  ```

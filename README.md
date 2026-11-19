# Mini-Proyecto-2 — Portal de Consulta de Políticas RRHH con RAG Multiagente (`TicoSoft S.A.`)

## Descripción
Plataforma de Recursos Humanos para **TicoSoft S.A.** (250 colaboradores en Costa Rica) con arquitectura multiagente basada en **Node.js, Express, Sequelize v6, PostgreSQL, Google Drive API y Gemini (`@google/generative-ai`)**.

## Estructura Actual
- `backend/`: API REST, migraciones 3FN (`20261117000001` a `20261119000007`), seeder enriquecido (260 colaboradores y asistencias CR), ingesta documental Drive/local (`ingestAgent.js`), 5 agentes (`orchestrator`, `policyAgent`, `dataAgent`, `analystAgent`, `validatorAgent`), gestión de justificantes (`/api/documents`), directorio de trabajadores (`/api/hr/workers`), crones diarios (06:45 y 07:00) y evaluador de 45 preguntas. Consulta [backend/README.md](./backend/README.md) para la guía técnica detallada.
- `documentos_drive/eiker/` y `documentos_drive/nuevas_politicas/`: 11+ documentos normativos laborales de Costa Rica (permisos/duelo, guía de justificación de ausencias en 48 h, jornada/teletrabajo, beneficios, evaluación, acoso, vacaciones/feriados, salarios/aguinaldo, incapacidades, onboarding y privacidad) junto con `Informe_Fase1_Normativa_CR_Eiker.md`.
- `.agents/skills/`: Skills de arquitectura, auditoría, bitácora y Git (`backend-postgres-guardian`, `bitacora-agente`, `design-taste-frontend`, `frontend-desing`, `frontend-react-structure`, `github-commits`, `repo-docs-updater`).
- `docs/`: Planificación del frontend (`Plan_Frontend_Kendall_MiniProyecto2.pdf`).
- `frontend/`: Portal React con Vite (`TicoSoft S.A. · Portal de Talento Humano`) para colaboradores y RRHH.

## Arranque Rápido del Backend
```bash
cd backend
npm install
cp .env.example .env   # Configurar DB_PASSWORD, GEMINI_API_KEY y GOOGLE_DRIVE_FOLDER_ID
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

## Portal Frontend (TicoSoft S.A. · Talento Humano)

El frontend implementa la experiencia unificada con identidad corporativa SVG (`BrandLogo.jsx` y `favicon.svg`), modo claro/oscuro y dos roles protegidos:

- **Colaborador (`/portal`):** chat RAG con citas y renderizado Markdown limpio, control de entrada/salida, apartado **Justificar ausencia** (`POST /api/documents`), calendario de feriados CR, saldo de vacaciones y solicitudes con motivo de rechazo visible.
- **RRHH (`/rrhh/dashboard` y `/rrhh/trabajadores`):** dashboard diario con KPIs, gráficas, aprobación/rechazo de solicitudes con motivo obligatorio, revisión de comprobantes (`DocumentsInbox`), directorio paginado con expedientes completos y monitor filtrable de **Control de jornada**.

### Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

Para conectarlo con Express, copia `frontend/.env.example` a `frontend/.env` y configura `VITE_API_URL=http://localhost:5000`.

### Verificaciones

```bash
cd frontend
npm test
npm run build
```

La estructura sigue `components → pages → routes → App → main`, con todas las llamadas HTTP autenticadas por cookies `HttpOnly` y `X-CSRF-Token` en `src/services/api.js`.

## Historial de Cambios
Consulta [CHANGELOG.md](./CHANGELOG.md) para el detalle de versiones y cambios recientes.

## Seguridad
Consulta [SECURITY.md](./SECURITY.md) para reporte de vulnerabilidades y controles implementados.

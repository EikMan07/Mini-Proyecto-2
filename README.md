# Mini-Proyecto-2 — Portal de Consulta de Políticas RRHH con RAG Multiagente (`TicoSoft S.A.`)

## Descripción
Plataforma de Recursos Humanos para **TicoSoft S.A.** (250 colaboradores en Costa Rica) con arquitectura multiagente basada en **Node.js, Express, Sequelize v6, PostgreSQL, Google Drive API y Gemini (`@google/generative-ai`)**.

## Estructura Actual
- `backend/`: API REST, migraciones 3FN, seeder de 250 colaboradores, ingesta documental Drive/local, 5 agentes (`orchestrator`, `policyAgent`, `dataAgent`, `analystAgent`, `validatorAgent`), crones diarios (06:45 y 07:00) y evaluador de 45 preguntas. Consulta [backend/README.md](./backend/README.md) para la guía técnica detallada.
- `documentos_drive/eiker/`: 5 políticas laborales de Costa Rica (PDF, DOCX, XLSX, MD) e `Informe_Fase1_Normativa_CR_Eiker.md`.
- `.agents/skills/`: Skills de arquitectura, auditoría, bitácora y Git (`backend-postgres-guardian`, `bitacora-agente`, `design-taste-frontend`, `frontend-desing`, `frontend-react-structure`, `github-commits`, `repo-docs-updater`).
- `docs/`: Planificación del frontend (`Plan_Frontend_Kendall_MiniProyecto2.pdf`).

## Arranque Rápido del Backend
```bash
cd backend
npm install
cp .env.example .env   # Configurar DB_PASSWORD y GEMINI_API_KEY
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

## Historial de Cambios
Consulta [CHANGELOG.md](./CHANGELOG.md) para el detalle de versiones y cambios recientes.

## Seguridad
Consulta [SECURITY.md](./SECURITY.md) para reporte de vulnerabilidades y controles implementados.

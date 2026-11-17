# Mini-Proyecto-2

## Descripción
Repositorio del proyecto **Mini-Proyecto-2**, inicializado con las skills de desarrollo y automatización del agente en `.agents/skills/` y la documentación inicial en `docs/`.

## Estructura Actual
- `.agents/skills/`: Skills configuradas para el asistente:
  - `backend-postgres-guardian`
  - `bitacora-agente`
  - `design-taste-frontend`
  - `frontend-desing`
  - `frontend-react-structure`
  - `github-commits`
  - `repo-docs-updater`
- `docs/`: Documentación del proyecto (`Plan_Frontend_Kendall_MiniProyecto2.pdf`).
- `frontend/`: Portal React con Vite para colaboradores y RRHH.

## Frontend Kendall

El frontend implementa el portal de políticas de RRHH con dos experiencias protegidas por rol:

- **Colaborador:** chat RAG con citas, alertas de privacidad, escalamiento, asistencia, comprobante médico, saldo y solicitudes.
- **RRHH:** dashboard diario con KPIs, tendencia de 30 días, top de temas, solicitudes vencidas, resumen ejecutivo e historial.

### Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

Para usar el backend real, copia `frontend/.env.example` a `frontend/.env` y configura `VITE_API_URL`. Sin esa variable, la app usa los mocks del contrato acordado con Eiker.

### Verificaciones

```bash
cd frontend
npm run build
npm test
```

La estructura sigue `components → pages → routes → App → main`. Las llamadas HTTP viven en `src/services/api.js`, mientras que `src/mocks/apiMock.js` permite trabajar antes de que estén disponibles los endpoints de Express.

## Historial de Cambios
Consulta [CHANGELOG.md](./CHANGELOG.md) para el detalle de versiones y cambios recientes.

## Seguridad
Consulta [SECURITY.md](./SECURITY.md) para reporte de vulnerabilidades y buenas prácticas.

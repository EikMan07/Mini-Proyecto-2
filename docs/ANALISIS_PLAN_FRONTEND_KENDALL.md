# Análisis técnico del plan frontend de Kendall

## Alcance

El plan solicita un portal de políticas de RRHH con dos experiencias aisladas por rol:

- **Colaborador:** inicio de sesión, chat RAG con citas, alertas de seguridad/escalamiento, asistencia, incapacidad, saldo y solicitudes.
- **RRHH:** dashboard exclusivo con KPIs, gráficos de 30 días, temas principales, solicitudes pendientes, resumen ejecutivo e historial de reportes.

## Decisiones de implementación

1. **Stack:** Vite, React, JavaScript/JSX, React Router y Recharts.
2. **Arquitectura:** `components → pages → routes → App → main`, con servicios, contexto, hooks, utilidades y mocks separados.
3. **Sesión:** `AuthContext` persiste usuario y token en `localStorage`; `ProtectedRoute` valida sesión y rol.
4. **API:** `services/api.js` centraliza las llamadas y permite usar `VITE_API_URL`; en ausencia de backend responde con `src/mocks/apiMock.js`.
5. **Seguridad UX:** las rutas RRHH no son visibles ni accesibles para colaboradores; las consultas restringidas muestran una alerta explícita y las consultas sin evidencia muestran escalamiento.
6. **Responsive:** portal y dashboard se adaptan a móvil; la navegación conserva acciones esenciales y los gráficos tienen altura controlada.
7. **Diseño:** dirección “operaciones editoriales”, con azul tinta como identidad, marfil como superficie, coral como acción y tipografía display/body diferenciada. No se usan gradientes, glassmorphism ni tarjetas genéricas como estructura principal.

## Matriz de requisitos → entregables

| Requisito | Entregable |
| --- | --- |
| Login por rol | `LoginPage`, `AuthContext`, `ProtectedRoute`, `AppRouter` |
| Persistencia JWT | `localStorage` y restauración al iniciar |
| Chat RAG | `ChatBox`, citas, agente, latencia y estados de carga |
| Consulta sin evidencia | `EscalationBanner` y acción de escalamiento |
| Consulta restringida | `SecurityAlert` |
| Asistencia e incapacidad | `AttendanceCard`, comprobante y confirmación |
| Vacaciones/permisos | `LeaveRequestModal`, saldo, historial y estados |
| Dashboard RRHH | `KpiGrid`, `Trend30DaysChart`, `TopTopicsChart`, `PendingTable` |
| Historial | `ReportHistorySelector` y carga por fecha |
| Backend futuro | servicios alineados a `/api/auth/login`, `/api/chat`, `/api/employee/me/summary`, `/api/attendance/check-in`, `/api/requests` y `/api/reports/daily` |
| Calidad | build, pruebas de componentes y verificación responsive |

## Trabajo por etapas

### Etapa 1 — Base y demo funcional

- Inicializar Vite y dependencias.
- Crear arquitectura React obligatoria.
- Implementar login, persistencia, navegación y protección por rol.
- Crear mocks completos y pantallas de colaborador/RRHH.

### Etapa 2 — Interacción y API

- Conectar servicios a `VITE_API_URL` sin mover llamadas a los componentes.
- Implementar chat, citas, escalamiento, asistencia y solicitudes.
- Implementar historial y gráficos de reportes.

### Etapa 3 — Calidad y entrega

- Ejecutar build y pruebas.
- Revisar accesibilidad, responsive y estados de carga/error.
- Actualizar README, CHANGELOG, SECURITY y bitácora.
- Crear commits convencionales por etapa y publicar `feature-kendall`.

## Pendientes de integración con Eiker

- Confirmar contrato final de respuestas y códigos HTTP.
- Configurar `VITE_API_URL` en el entorno de despliegue.
- Sustituir mocks por respuestas reales y probar las preguntas 19, 21 y 22.
- Verificar enlaces de Google Drive y permisos de la cuenta de servicio.
- Añadir los cinco documentos de política y la hoja de 45 preguntas cuando estén disponibles.

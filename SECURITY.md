# Política de Seguridad

## Versiones Compatibles
| Versión | Soportada |
| :--- | :--- |
| 1.0.x | :white_check_mark: |

## Controles de Seguridad Implementados
- **Autenticación y Sesiones:** Contraseñas cifradas con `bcryptjs` (excluidas por `defaultScope` y `toJSON()`). JWT firmado con `HS256` y transmitido únicamente en cookie `HttpOnly` (`sid` en desarrollo, `__Host-sid` con `Secure=true` en producción) con expiración deslizante de 25 minutos.
- **Defensa Anti-CSRF en Capas:** Cookie `SameSite=Lax`, validación de `Origin`/`Referer` (`verificarOrigen`) y token HMAC-SHA256 en cabecera `X-CSRF-Token` verificado con `crypto.timingSafeEqual`.
- **CORS y Cabeceras:** `helmet()`, `express-rate-limit` en autenticación y `cors` con origen explícito (`FRONTEND_URL`) y `credentials: true` (prohibido `*`).
- **Validación y Privacidad (Ley N.° 8968):** Esquemas `Zod` en el borde (`validar.js`) para prevenir *mass assignment* (incluyendo `tipo_justificacion`, fechas de ausencia y `motivo_rechazo` mínimo de 5 caracteres en solicitudes), filtrado estricto por `colaborador_id` y `rol` en `dataAgent.js`, bloqueo de partes de razonamiento interno (`thought`) en `llmService.js`, guardrail determinista anti-fuga de datos de terceros en `orchestrator.js` y validación post-entrega en `validatorAgent.js`.
- **Carga Segura de Comprobantes:** `/api/documents` limita los archivos con `multer` a PDF/JPG/PNG de hasta 5 MB en almacenamiento local ignorado por Git (`uploads/`), con validación de rutas (`path.basename` + prefijo `UPLOADS_DIR`) y autorización por propietario o rol `rrhh`.
- **Manejo de Secretos:** `.env`, `service-account.json`, `uploads/` y `backend/credenciales/*.json` están excluidos del control de versiones en `.gitignore`.

## Reportar una Vulnerabilidad
Si detectas alguna vulnerabilidad de seguridad en este repositorio, repórtala de manera responsable antes de abrir una incidencia pública.

## Buenas Practicas de Seguridad
- No almacenar credenciales, llaves API ni tokens en el historial de Git.
- Utilizar variables de entorno protegidas (`.env`).
- Mantener dependencias actualizadas mediante auditorías regulares (`npm audit`).
- Implementar sanitización de entradas y protección contra ataques comunes (XSS, SQLi, CSRF).
- La sesión en React (`AuthContext.jsx`) reside estrictamente en memoria y se restaura vía `/api/auth/yo` usando cookies `HttpOnly` y `credentials: 'include'`, sin almacenar tokens en `localStorage` ni `sessionStorage`.
- Las rutas protegidas validan el rol en el cliente como experiencia de usuario; toda autorización real se verifica en el backend en cada endpoint.
- Los enlaces a Google Drive conservan permisos mínimos y nunca incluyen credenciales en el repositorio.

# Política de Seguridad

## Versiones Compatibles
| Versión | Soportada |
| :--- | :--- |
| 1.0.x | :white_check_mark: |

## Controles de Seguridad Implementados
- **Autenticación y Sesiones:** Contraseñas cifradas con `bcryptjs` (excluidas por `defaultScope` y `toJSON()`). JWT firmado con `HS256` y transmitido únicamente en cookie `HttpOnly` (`sid` en desarrollo, `__Host-sid` con `Secure=true` en producción) con expiración deslizante de 25 minutos.
- **Defensa Anti-CSRF en Capas:** Cookie `SameSite=Lax`, validación de `Origin`/`Referer` (`verificarOrigen`) y token HMAC-SHA256 en cabecera `X-CSRF-Token` verificado con `crypto.timingSafeEqual`.
- **CORS y Cabeceras:** `helmet()`, `express-rate-limit` en autenticación y `cors` con origen explícito (`FRONTEND_URL`) y `credentials: true` (prohibido `*`).
- **Validación y Privacidad (Ley N.° 8968):** Esquemas `Zod` en el borde (`validar.js`) para prevenir *mass assignment*, filtrado estricto por `colaborador_id` y `rol` en `dataAgent.js`, guardrail determinista anti-fuga de datos de terceros en `orchestrator.js` y validación post-entrega en `validatorAgent.js`.
- **Manejo de Secretos:** `.env`, `service-account.json` y `backend/credenciales/*.json` están excluidos del control de versiones en `.gitignore`.

## Reportar una Vulnerabilidad
Si detectas alguna vulnerabilidad de seguridad en este repositorio, repórtala de manera responsable antes de abrir una incidencia pública.
## Buenas Practicas de Seguridad
- No almacenar credenciales, llaves API ni tokens en el historial de Git.
- Utilizar variables de entorno protegidas (.env).
- Mantener dependencias actualizadas mediante auditorias regulares (`npm audit`).
- Implementar sanitizacion de entradas y proteccion contra ataques comunes (XSS, SQLi, CSRF).
- El token y los datos de sesión del demo se guardan en `localStorage` únicamente para facilitar la demostración local; en producción debe usarse el mecanismo seguro definido por el backend, idealmente cookies `HttpOnly` y `SameSite`.
- Las rutas de RRHH validan el rol en el cliente como control de experiencia; la autorización real debe repetirse en cada endpoint del backend.
- Los enlaces a Google Drive deben conservar permisos mínimos y no deben incluir tokens ni credenciales en el repositorio.

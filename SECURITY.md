# Politica de Seguridad

## Versiones Compatibles
| Version | Soportada |
| :--- | :--- |
| 1.0.x | :white_check_mark: |

## Reportar una Vulnerabilidad
Si detectas alguna vulnerabilidad de seguridad en este repositorio, por favor reportala de manera responsable antes de abrir una incidencia publica.

## Buenas Practicas de Seguridad
- No almacenar credenciales, llaves API ni tokens en el historial de Git.
- Utilizar variables de entorno protegidas (.env).
- Mantener dependencias actualizadas mediante auditorias regulares (`npm audit`).
- Implementar sanitizacion de entradas y proteccion contra ataques comunes (XSS, SQLi, CSRF).
- El token y los datos de sesión del demo se guardan en `localStorage` únicamente para facilitar la demostración local; en producción debe usarse el mecanismo seguro definido por el backend, idealmente cookies `HttpOnly` y `SameSite`.
- Las rutas de RRHH validan el rol en el cliente como control de experiencia; la autorización real debe repetirse en cada endpoint del backend.
- Los enlaces a Google Drive deben conservar permisos mínimos y no deben incluir tokens ni credenciales en el repositorio.

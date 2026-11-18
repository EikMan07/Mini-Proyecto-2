# Changelog

Todos los cambios notables de este proyecto seran documentados en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Documentation
- registra sincronización de cambios
  Registra la preparación y publicación de todos los cambios pendientes en la rama feature-kendall.\n\nLa rama local se verificó contra origin/feature-kendall antes de ejecutar git add, git commit y git push.

- registra entrega frontend
  Registra en la bitácora la publicación de la primera etapa del portal React en feature-kendall y confirma la sincronización con origin/feature-kendall.


### Added
- **frontend:** renueva sistema de animaciones
  Añade transiciones de rutas, entradas escalonadas, springs de navegación, microinteracciones y motion coordinado para dashboards.

- **frontend:** usa hora y ubicación reales
  Integra Geolocation API, reverse geocoding y reloj vivo en la tarjeta de jornada con fallback de privacidad.

- **frontend:** completa flujos del portal
  Corrige acceso por roles, estados de error, reintentos, accesibilidad de modal, chat consciente del scroll, asistencia y tablero RRHH.

- **frontend:** mejora layout animations
  Añade LayoutGroup, layoutId y springs coordinados al dashboard Kendall, junto con mejoras visuales premium, dark mode y microinteracciones.

- **frontend:** crea portal RRHH
  Implementa el frontend inicial de Kendall con autenticación demo por rol, portal del colaborador, dashboard exclusivo de RRHH, chat RAG con citas, asistencia, solicitudes, gráficos e historial.\n\nLa integración usa VITE_API_URL cuando existe y mocks locales en caso contrario. Se documentan los comandos de instalación, las rutas principales y las consideraciones de seguridad para la sesión local y la autorización del backend.


### Fixed
- **frontend:** elimina flash al cerrar sesión
  Añade una transición opaca de salida y navegación replace para evitar mostrar brevemente la pantalla protegida.

- **frontend:** ajusta responsive de jornada
  Corrige la composición responsive de asistencia, hora real, botón de entrada, sidebar, grids y tarjetas para tablet y móvil.

- **frontend:** corrige hora de asistencia demo
  Evita mostrar una hora fija como entrada registrada; el mock usa la hora actual solo después de marcar asistencia.


### Changed

### Security

### Maintenance
- **frontend:** rediseña toda la interfaz
  Aplica una dirección editorial enterprise completa a login, portal, RRHH, navegación, cards, chat, formularios y responsive.

- **repo:** añade skills y docs iniciales
  Inicializa la estructura base del repositorio Mini-Proyecto-2 con las skills de automatizacion del agente y la documentacion inicial del plan de frontend.
  
  Cambios principales:
  - Se instalan 7 skills en .agents/skills/: backend-postgres-guardian, bitacora-agente, design-taste-frontend, frontend-desing, frontend-react-structure, github-commits y repo-docs-updater.
  - Se agrega docs/Plan_Frontend_Kendall_MiniProyecto2.pdf con la planificacion inicial del frontend.
  - Se sincronizan CHANGELOG.md, README.md y SECURITY.md mediante repo-docs-updater previo al commit inicial.


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
- **frontend:** crea portal RRHH
  Implementa el frontend inicial de Kendall con autenticación demo por rol, portal del colaborador, dashboard exclusivo de RRHH, chat RAG con citas, asistencia, solicitudes, gráficos e historial.\n\nLa integración usa VITE_API_URL cuando existe y mocks locales en caso contrario. Se documentan los comandos de instalación, las rutas principales y las consideraciones de seguridad para la sesión local y la autorización del backend.


### Fixed

### Changed

### Security

### Maintenance
- **repo:** añade skills y docs iniciales
  Inicializa la estructura base del repositorio Mini-Proyecto-2 con las skills de automatizacion del agente y la documentacion inicial del plan de frontend.
  
  Cambios principales:
  - Se instalan 7 skills en .agents/skills/: backend-postgres-guardian, bitacora-agente, design-taste-frontend, frontend-desing, frontend-react-structure, github-commits y repo-docs-updater.
  - Se agrega docs/Plan_Frontend_Kendall_MiniProyecto2.pdf con la planificacion inicial del frontend.
  - Se sincronizan CHANGELOG.md, README.md y SECURITY.md mediante repo-docs-updater previo al commit inicial.


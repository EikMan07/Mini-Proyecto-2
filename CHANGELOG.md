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
- **workflow:** conecta solicitudes con rrhh
  Agrega fechas reales, aprobación y rechazo de solicitudes, bandeja de comprobantes y persistencia local preparada para base de datos.

- **attendance:** agrega marca de salida
  Añade cierre de jornada, persistencia de entrada y salida para la demo y visualización administrativa.

- **frontend:** integra datos laborales reales
  Añade registro de trabajadores, validación de cédula configurable, ubicación, calendario laboral y documentos oficiales del MTSS.

- **frontend:** agrega colores de acento
  Añade un selector persistente de colores para personalizar el acento visual en modo claro y oscuro.

- **frontend:** completa reportes y chat
  Amplía el chat con respuestas personales y mixtas, y agrega el detalle operativo completo del reporte diario de RRHH.

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
- **auth:** elimina flash al cerrar sesión
  Mantiene el overlay global durante el cierre de sesión y la navegación al login.

- **frontend:** corrige responsive móvil
  Ajusta sidebar móvil, navegación compacta y composición de la tarjeta de jornada a partir de la grabación.

- **frontend:** elimina flash al cerrar sesión
  Añade una transición opaca de salida y navegación replace para evitar mostrar brevemente la pantalla protegida.

- **frontend:** ajusta responsive de jornada
  Corrige la composición responsive de asistencia, hora real, botón de entrada, sidebar, grids y tarjetas para tablet y móvil.

- **frontend:** corrige hora de asistencia demo
  Evita mostrar una hora fija como entrada registrada; el mock usa la hora actual solo después de marcar asistencia.


### Changed

### Security

### Maintenance
- **frontend:** ajusta centro laboral
  Hace que el centro de derechos y deberes ocupe todo el ancho y distribuye sus documentos responsivamente.

- **frontend:** eleva calendario laboral
  Mueve el calendario de feriados al inicio de la columna derecha y conserva el layout responsive.

- **frontend:** limpia encabezado del portal
  Retira el subtítulo del portal del colaborador y evita reservar espacio cuando no existe.

- **frontend:** retira icono lateral
  Elimina el icono coral del encabezado de la barra lateral y conserva la navegación textual.

- **frontend:** rediseña toda la interfaz
  Aplica una dirección editorial enterprise completa a login, portal, RRHH, navegación, cards, chat, formularios y responsive.

- **repo:** añade skills y docs iniciales
  Inicializa la estructura base del repositorio Mini-Proyecto-2 con las skills de automatizacion del agente y la documentacion inicial del plan de frontend.
  
  Cambios principales:
  - Se instalan 7 skills en .agents/skills/: backend-postgres-guardian, bitacora-agente, design-taste-frontend, frontend-desing, frontend-react-structure, github-commits y repo-docs-updater.
  - Se agrega docs/Plan_Frontend_Kendall_MiniProyecto2.pdf con la planificacion inicial del frontend.
  - Se sincronizan CHANGELOG.md, README.md y SECURITY.md mediante repo-docs-updater previo al commit inicial.


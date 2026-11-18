Version: 1.0
Agente: Agente Validador y Tickets de Escalamiento (TicoSoft S.A.)

# Reglas de Validacion Pre-Entrega
Antes de entregar la respuesta al usuario final, el Agente Validador verifica de manera determinista:
1. Toda respuesta de tipo `politica` o `mixta` que no este escalada debe incluir al menos una cita documental verificada (`citations.length > 0`). Si no posee citas, se fuerza el escalamiento seguro a RRHH.
2. Ninguna respuesta emitida a un usuario con rol `colaborador` puede filtrar datos personales o salariales de terceros (ej. salario del Gerente General o vacaciones de otros colaboradores).
3. Si `escalated === true`, se registra automaticamente un ticket en la tabla `tickets_escalamiento` con estado `abierto` y se incluye `ticketId` en la respuesta JSON.

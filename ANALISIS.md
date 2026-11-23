# Análisis del sistema LabCare

## 1. Descripción del problema

En los laboratorios de computación de la UPDS las fallas de equipos se reportan
mediante mensajes informales y hojas de cálculo. Esto provoca:

- Pérdida de solicitudes.
- Ausencia de un identificador único por reporte.
- Falta de seguimiento del estado de la reparación.
- Imposibilidad de filtrar, buscar o auditar históricos.
- Estadísticas manuales y poco confiables.

## 2. Objetivo general

Implementar un sistema web funcional que permita gestionar el ciclo completo de
las solicitudes de mantenimiento de equipos de laboratorio, con persistencia
real en Supabase y reglas de negocio validadas en el backend.

## 3. Actor principal

**Administrador / responsable de laboratorio**: registra solicitudes, consulta
el catálogo de equipos, edita datos, cambia estados, elimina lógicamente y
consulta indicadores e historial.

Actor secundario: **solicitante** (persona que reporta la falla; no requiere
autenticación en el alcance del examen).

## 4. Alcance

### Incluido
- Catálogo de los cuatro equipos iniciales, consultado desde Supabase.
- Registro de solicitudes con código automático y estado inicial PENDIENTE.
- Listado de solicitudes activas con búsqueda y filtros combinables.
- Consulta de detalle, edición descriptiva y cambio de estado independiente.
- Eliminación lógica e historial de transiciones.
- Dashboard con indicadores reales.
- API REST, validaciones, manejo de errores y documentación.

### Excluido
- Autenticación de usuarios y roles (no solicitada en el examen).
- Alta/edición de equipos desde la interfaz (el catálogo es fijo).
- Notificaciones por correo o mensajería.
- Despliegue en producción.

## 5. Requerimientos funcionales

| ID | Requerimiento |
|---|---|
| RF-01 | Listar los equipos almacenados en Supabase |
| RF-02 | Registrar solicitudes con equipo, solicitante, descripción y prioridad |
| RF-03 | Generar automáticamente código único, fechas, estado PENDIENTE y activo TRUE |
| RF-04 | Listar únicamente solicitudes activas |
| RF-05 | Consultar el detalle completo de una solicitud |
| RF-06 | Editar equipo, solicitante, descripción y prioridad |
| RF-07 | Cambiar el estado respetando las transiciones permitidas |
| RF-08 | Eliminar lógicamente una solicitud con confirmación |
| RF-09 | Buscar por código de solicitud, solicitante o equipo |
| RF-10 | Filtrar por prioridad y estado y limpiar filtros |
| RF-11 | Consultar historial de solicitudes y de cambios de estado |
| RF-12 | Mostrar estadísticas reales en el dashboard |

## 6. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solicitante obligatorio, mínimo 3 caracteres después de recortar espacios |
| RN-02 | Descripción obligatoria, mínimo 10 caracteres después de recortar espacios |
| RN-03 | Prioridad ∈ {BAJA, MEDIA, ALTA} |
| RN-04 | Estado ∈ {PENDIENTE, EN_PROCESO, RESUELTA, CANCELADA} |
| RN-05 | Toda solicitud nueva inicia en PENDIENTE con activo = TRUE |
| RN-06 | PENDIENTE → EN_PROCESO o CANCELADA |
| RN-07 | EN_PROCESO → RESUELTA o CANCELADA |
| RN-08 | RESUELTA y CANCELADA son terminales; no se permite retroceso |
| RN-09 | La edición no modifica id, código, fecha_registro ni estado |
| RN-10 | Eliminar cambia activo a FALSE; nunca se borra el registro físicamente |
| RN-11 | El equipo debe existir en Supabase antes de registrar/editar |
| RN-12 | Códigos de equipo y de solicitud únicos |

## 7. Requerimientos técnicos

- Frontend React + Vite + Bootstrap 5 + React Router + Axios + SweetAlert2 + Lucide.
- Backend Node + Express con separación config/models/repositories/services/
  controllers/routes/middlewares/validators/utils.
- PostgreSQL en Supabase con claves primarias foráneas, restricciones CHECK,
  índices, triggers de auditoría y función generadora de códigos con bloqueo
  de fila.
- Variables de entorno para credenciales; SERVICE_ROLE_KEY exclusivamente en
  el backend.
- CORS restringido al origen del frontend.
- Validación Zod en todas las entradas y respuestas JSON consistentes.
- Manejo centralizado de errores sin exponer trazas internas.
- Pruebas unitarias y script de verificación de extremo a extremo.

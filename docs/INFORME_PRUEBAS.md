# INFORME DE AUDITORÍA Y EJECUCIÓN DE PRUEBAS — LABCARE

**Fecha de ejecución:** 23 de noviembre de 2026  
**Entorno:** Node v24.11.1 · npm 11.6.2 · Windows 11  
**API:** `http://localhost:3000/api`  
**Base de datos:** Supabase PostgreSQL — proyecto `ExamenDesarrolloDeSistemas2`  
**Método:** `npm run auditoria` (peticiones HTTP reales + consultas directas con el cliente oficial de Supabase en el backend)  
**Datos:** 100% reales. Cada caso crea registros en Supabase; al finalizar se desactivan lógicamente.

---

## 1. Verificación previa de conexión

```http
GET /api/health
HTTP 200
{"success":true,"servicio":"LabCare API","supabase":"conectado","entorno":"development"}
```

Consulta directa a Supabase (cliente service-role, **solo backend**):

```text
supabase.from('equipos').select('codigo, nombre, ubicacion, estado').order('codigo')
→ 4 filas: EQ-001, EQ-002, EQ-003, EQ-004
```

La API y Supabase estaban efectivamente conectados antes de ejecutar cualquier caso.

---

## 2. Matriz de ejecución

| ID | Descripción | Procedimiento | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-01 | Registrar solicitud con datos válidos | `POST /solicitudes` con equipo existente y datos válidos; `SELECT` por `id` en Supabase | 201, estado `PENDIENTE`, `activo=TRUE`, código `SOL-AAAAMMDD-XXX` único | `201 — SOL-20261123-024`, `PENDIENTE`, `activo TRUE`; fila confirmada en Supabase con el mismo código | **APROBADO** |
| CP-02 | Registrar solicitante vacío | `POST /solicitudes` con `solicitante: "   "`; `SELECT` por marcador único | 400 y 0 filas insertadas | `400 — {"error":"Datos inválidos", ... "El solicitante debe tener al menos 3 caracteres"}`; `0` filas en Supabase | **APROBADO** |
| CP-03 | Registrar descripción < 10 caracteres | `POST /solicitudes` con `descripcion: "Falla"`; `SELECT` por solicitante único | 400 y 0 filas insertadas | `400 — La descripción debe tener al menos 10 caracteres`; `0` filas en Supabase | **APROBADO** |
| CP-04 | Enviar prioridad incorrecta | `POST /solicitudes` con `prioridad: "URGENTE"`; `SELECT` por solicitante único | 400 y 0 filas insertadas | `400 — Prioridad inválida. Use BAJA, MEDIA o ALTA`; `0` filas en Supabase | **APROBADO** |
| CP-05 | Seleccionar equipo inexistente | `POST /solicitudes` con UUID `00000000-0000-4000-8000-000000000000` | 404 y 0 filas insertadas | `404 — Equipo no encontrado`; `0` filas en Supabase | **APROBADO** |
| CP-06 | Editar una solicitud | `PUT /solicitudes/:id` cambiando equipo, solicitante, descripción y prioridad; `SELECT` antes/después | 200; solo cambia ese registro; ID, código, `fecha_registro` y estado intactos | `200`; solicitante, descripción, equipo y prioridad actualizados; `fecha_actualizacion` cambiada por trigger; código único con 1 sola fila; ID, `fecha_registro` y estado conservados | **APROBADO** |
| CP-07 | Cambiar de PENDIENTE a EN_PROCESO | `PATCH /solicitudes/:id/estado` → `EN_PROCESO`; `SELECT` en `solicitudes` e `historial_estados` | 200, estado persistido y transición registrada | `200`; Supabase devuelve `EN_PROCESO`; historial contiene `PENDIENTE → EN_PROCESO` | **APROBADO** |
| CP-08 | Cambiar de RESUELTA a PENDIENTE | `PATCH` → `RESUELTA` (válida), luego `PATCH` → `PENDIENTE` (inválida); `SELECT` de estado e historial | 409; el registro sigue `RESUELTA`; sin nueva fila de historial | Segunda petición `409 — {"error":"Transición de estado no permitida", "details":"La solicitud ya está en un estado final (RESUELTA)"}`; estado `RESUELTA`; historial `2 → 2` filas | **APROBADO** |
| CP-09 | Eliminar lógicamente una solicitud | `DELETE /solicitudes/:id`; `GET /solicitudes` y `/historial`; `SELECT` directo por ID | 200; ausente del listado, presente en historial y con `activo=FALSE` en Supabase | `200 — activo:false`; `GET /solicitudes → []`; `GET /historial` contiene el registro; `SELECT` directo confirma `activo:false` y que la fila **no** se borró físicamente | **APROBADO** |
| CP-10 | Buscar y filtrar combinando criterios | Crear solicitud única; `GET /solicitudes?q=<solicitante>&prioridad=BAJA&estado=PENDIENTE`; búsqueda por nombre de equipo; búsqueda sin coincidencias; `SELECT ... ilike` | Coincidencias correctas y lista vacía en el caso negativo | `200`; 1 coincidencia por solicitante + prioridad + estado; 1 coincidencia por `Computadora de escritorio`; 0 coincidencias para `NoExiste123456`; consulta directa `ilike` devuelve la misma fila | **APROBADO** |
| CP-11 | Consultar/editar ID inexistente | `GET` y `PUT /solicitudes/00000000-0000-4000-8000-000000000000` | 404 controlado en ambos, con JSON consistente | `404` en GET y PUT; `{"success":false,"error":"..."}` sin trazas internas | **APROBADO** |
| CP-12 | Persistencia tras recargar | Nueva `GET` (equivalente a recargar el navegador) y `SELECT` directo por ID | 200 con los mismos datos y fila presente en Supabase | `200 — SOL-20261123-025` con solicitante, prioridad y estado idénticos; `SELECT` directo confirma `activo:true` | **APROBADO** |

**Resumen:** 12 ejecutadas · **12 APROBADAS** · 0 RECHAZADAS · 0 NO EJECUTADAS.

---

## 3. Evidencias gráficas de la ejecución

Las siguientes imágenes son capturas del informe técnico generado automáticamente por la auditoría (`docs/evidencias/evidencia-pruebas.html`), que contiene las respuestas HTTP y las consultas a Supabase tal como fueron recibidas.

### 3.1 Tabla de resultados

![Resumen de los 12 casos de prueba](evidencias/captura-01-resumen.png)

### 3.2 CP-01 a CP-04 — registro y validaciones negativas

![Evidencia CP-01 a CP-04](evidencias/captura-02-cp01-cp04.png)

### 3.3 CP-05 a CP-08 — equipo inexistente, edición y transiciones

![Evidencia CP-05 a CP-08](evidencias/captura-03-cp05-cp08.png)

### 3.4 CP-09 a CP-12 — eliminación lógica, filtros y persistencia

![Evidencia CP-09 a CP-12](evidencias/captura-04-cp09-cp12.png)

### 3.5 Verificación directa en Supabase

![Verificación final en Supabase](evidencias/captura-05-supabase.png)

---

## 4. Evidencias técnicas seleccionadas

### 4.1 Respuesta HTTP del caso positivo CP-01

```http
POST /api/solicitudes
HTTP 201
{
  "success": true,
  "message": "Solicitud registrada correctamente",
  "data": {
    "id": "9de2b4fa-eac9-4a35-9a17-c6c14e720a5e",
    "codigo_solicitud": "SOL-20261123-024",
    "solicitante": "Auditoría CP-01 2026-11-23T16-40-02-618Z",
    "prioridad": "MEDIA",
    "estado": "PENDIENTE",
    "activo": true,
    "equipos": { "codigo": "EQ-001", "nombre": "Computadora de escritorio" }
  }
}
```

Verificación en base de datos:

```text
supabase.from('solicitudes')
  .select('id, codigo_solicitud, solicitante, estado, activo, fecha_registro')
  .eq('id', '9de2b4fa-eac9-4a35-9a17-c6c14e720a5e')

→ codigo_solicitud: SOL-20261123-024
→ estado: PENDIENTE
→ activo: true
```

### 4.2 Validación negativa CP-02

```http
POST /api/solicitudes  { "solicitante": "   ", ... }
HTTP 400
{
  "success": false,
  "error": "Datos inválidos",
  "details": {
    "campos": {
      "solicitante": ["El solicitante debe tener al menos 3 caracteres"]
    },
    "mensaje": "solicitante: El solicitante debe tener al menos 3 caracteres"
  }
}
```

```text
supabase.from('solicitudes').select('id').eq('descripcion', '...CP02-...')
→ { "filas": 0 }
```

### 4.3 Transición inválida CP-08

```http
PATCH /api/solicitudes/9de2b4fa-.../estado  { "estado": "PENDIENTE" }
HTTP 409
{
  "success": false,
  "error": "Transición de estado no permitida",
  "details": "La solicitud ya está en un estado final (RESUELTA)"
}
```

```text
SELECT estado e historial tras el rechazo:
→ estado: "RESUELTA"
→ historial_antes: 2
→ historial_despues: 2
```

### 4.4 Eliminación lógica CP-09

```http
DELETE /api/solicitudes/9de2b4fa-...
HTTP 200
{ "success": true, "message": "Solicitud eliminada lógicamente",
  "data": { "id": "9de2b4fa-...", "codigo_solicitud": "SOL-20261123-024", "activo": false } }

GET /api/solicitudes               → HTTP 200, data: []
GET /api/solicitudes/historial     → HTTP 200, contiene SOL-20261123-024 con activo:false
SELECT directo por id en Supabase  → la fila existe y activo = false
```

### 4.5 Filtros combinados CP-10

```http
GET /api/solicitudes?q=Auditoría%20CP10...&prioridad=BAJA&estado=PENDIENTE
HTTP 200
{ "success": true, "data": [ { "codigo_solicitud": "SOL-20261123-025",
    "solicitante": "Auditoría CP10 ...", "prioridad": "BAJA", "estado": "PENDIENTE" } ] }

GET /api/solicitudes?q=NoExiste123456&prioridad=ALTA
HTTP 200
{ "success": true, "data": [] }
```

### 4.6 Estados finales de Supabase tras la limpieza

```json
{
  "equipos": 4,
  "solicitudes_totales": 25,
  "solicitudes_activas": 0,
  "solicitudes_inactivas": 25,
  "filas_historial": 26,
  "ultimo_contador": { "fecha": "2026-11-23", "ultimo": 25 }
}
```

Las 25 solicitudes acumuladas corresponden a ejecuciones reales de pruebas y capturas de Documentación; todas permanecen en Supabase con `activo = FALSE` como evidencia de auditoría. El listado habitual (`GET /solicitudes`) devuelve 0 registros, lo que confirma que la limpieza fue lógica y no física.

---

## 5. Pruebas unitarias complementarias

```text
npm test
✔ 12 pruebas unitarias de dominio/validaciones
tests 12 | pass 12 | fail 0
```

```text
npm run lint --prefix frontend  → 0 errores
npm run build --prefix frontend → compilación correcta
npm audit --omit=dev            → 0 vulnerabilidades (backend y frontend)
```

---

## 6. Errores encontrados y correcciones

**Errores funcionales del sistema LabCare: ninguno.** Los 12 casos pasaron en la ejecución documentada y no fue necesario modificar controladores, servicios, repositorios ni esquema SQL.

Ajustes realizados al **procedimiento/harness de auditoría** antes de obtener el resultado final:

1. **Snapshot de base de datos inconsistente:** el informe tomaba la fotografía final de Supabase antes de la limpieza lógica, por lo que mostraba 1 solicitud activa. Se reordenó el script para desactivar los registros de prueba y **después** consultar el estado final. Resultado corregido: `solicitudes_activas: 0`.
2. **Sintaxis del generador de informes:** se corrigió una asignación accidental dentro de un bloque etiquetado en el manejador de errores y una declaración de variable mal escrita en `backend/scripts/auditoria-pruebas.js`. El script pasó `node --check` antes de ejecutarse.
3. **Evidencia gráfica:** la primera versión del script de capturas dependía de un clic en el sidebar móvil, que fallaba por la animación de Bootstrap/React. Se sustituyó por navegación directa a la ruta; las 12 capturas de interfaz y las 5 capturas de evidencia de pruebas se generan ahora de forma determinista.

No se marcaron pruebas como aprobadas sin ejecución: cada estado `APROBADO` de la tabla responde a una petición HTTP real y a su verificación correspondiente en Supabase, registradas en `docs/evidencias/resultados-auditoria.json`.

---

## 7. Resumen final

| Concepto | Cantidad |
|---|---|
| Pruebas ejecutadas | 12 |
| APROBADAS | 12 |
| RECHAZADAS | 0 |
| NO EJECUTADAS | 0 |
| Evidencias gráficas de interfaz | 12 |
| Evidencias gráficas de pruebas | 5 |
| Registros de prueba desactivados lógicamente | 2 |

**Conclusión:** el sistema LabCare cumple los 12 casos del examen integrador con persistencia real en Supabase, validaciones positivas y negativas en backend, transiciones de estado controladas, eliminación lógica y supervivencia de los datos tras recargar.

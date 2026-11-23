# Matriz de pruebas — LabCare

**Fecha de ejecución:** 23 de noviembre de 2026  
**Entorno:** Node v24.11.1, npm 11.6.2, Windows  
**Base de datos:** Supabase PostgreSQL — `ExamenDesarrolloDeSistemas2`

## Estado general de la verificación

| Verificación | Comando | Resultado |
|---|---|---|
| Pruebas unitarias de dominio y validaciones | `npm test` | ✅ **Ejecutado**: 12/12 correctas |
| Compilación de producción del frontend | `npm run build --prefix frontend` | ✅ **Ejecutado**: compilación correcta |
| Análisis estático (ESLint) | `npm run lint --prefix frontend` | ✅ **Ejecutado**: 0 errores |
| Carga de la aplicación Express | `node backend/server.js` | ✅ **Ejecutado**: API iniciada en puerto 3000 |
| Conexión real con Supabase | `curl http://localhost:3000/api/health` | ✅ **Ejecutado**: `"supabase":"conectado"`, HTTP 200 |
| Catálogo inicial desde Supabase | `curl http://localhost:3000/api/equipos` | ✅ **Ejecutado**: 4 equipos (`EQ-001` … `EQ-004`) |
| Pruebas E2E CP-01 … CP-12 | `npm run verificar:api` | ✅ **Ejecutado**: 17/17 verificaciones correctas |
| Auditoría de dependencias de producción | `npm audit --omit=dev` (backend y frontend) | ✅ **Ejecutado**: 0 vulnerabilidades |
| Comprobación HTTP de errores | Servidor + `curl` | ✅ **Ejecutado**: 404, 400 y 503 controlados |
| Generación de evidencia gráfica | `npm run capturas` (Playwright/Chromium) | ✅ **Ejecutado**: 12 capturas en `docs/capturas/` con datos reales |

---

## Casos de prueba funcionales

| CP | Caso | Resultado esperado | Estado | Evidencia |
|---|---|---|---|---|
| CP-01 | Registrar solicitud con datos válidos | 201, estado PENDIENTE, código `SOL-AAAAMMDD-XXX` único | ✅ Ejecutado | Código generado: `SOL-20261123-004`, estado PENDIENTE, activo TRUE |
| CP-02 | Registrar solicitante vacío | Backend rechaza (400) | ✅ Ejecutado | Respuesta 400 con mensaje «El solicitante debe tener al menos 3 caracteres» |
| CP-03 | Descripción con menos de 10 caracteres | Backend rechaza (400) | ✅ Ejecutado | Respuesta 400 con mensaje «La descripción debe tener al menos 10 caracteres» |
| CP-04 | Prioridad incorrecta | Backend rechaza (400) | ✅ Ejecutado | Respuesta 400: «Prioridad inválida. Use BAJA, MEDIA o ALTA» |
| CP-05 | Equipo inexistente | No se registra la solicitud (404) | ✅ Ejecutado | UUID inexistente rechazado con 404 |
| CP-06 | Editar una solicitud | Solo se modifica el registro seleccionado | ✅ Ejecutado | Solicitante y prioridad actualizados; código original conservado |
| CP-07 | PENDIENTE → EN_PROCESO | Transición aceptada (200) | ✅ Ejecutado | Estado devuelto `EN_PROCESO` |
| CP-08 | RESUELTA → PENDIENTE | Transición rechazada (409) | ✅ Ejecutado | Respuesta 409 «Transición de estado no permitida» |
| CP-09 | Eliminación lógica | Desaparece del listado, permanece en Supabase | ✅ Ejecutado | No aparece en `/solicitudes`; sí en `/solicitudes/historial` con `activo:false` |
| CP-10 | Búsqueda y filtros combinados | Coincidencias correctas | ✅ Ejecutado | `q=Ana Filtros&prioridad=BAJA&estado=PENDIENTE` devolvió el registro; búsqueda sin coincidencias devolvió `[]` |
| CP-11 | ID inexistente | 404 controlado | ✅ Ejecutado | GET y PUT con UUID inexistente → 404 |
| CP-12 | Persistencia tras recargar | Datos disponibles desde Supabase | ✅ Ejecutado | Nueva petición GET devolvió el registro guardado |

## Verificaciones adicionales ejecutadas

| Verificación | Resultado |
|---|---|
| EN_PROCESO → RESUELTA aceptada | ✅ |
| Trigger de `historial_estados` registrando transiciones | ✅ |
| Limpieza lógica de los registros de prueba al finalizar | ✅ |
| Dashboard con datos reales (`totalEquipos: 4`, `totalActivas: 0` tras la limpieza) | ✅ |

---

## Salida real de `npm run verificar:api`

```
✅ SETUP API y Supabase conectados
✅ SETUP Catálogo leído (4 equipos)
✅ CP-01 Registro válido con código y estado PENDIENTE — SOL-20261123-004
✅ CP-02 Solicitante vacío rechazado
✅ CP-03 Descripción menor a 10 caracteres rechazada
✅ CP-04 Prioridad incorrecta rechazada
✅ CP-05 Equipo inexistente rechazado
✅ CP-06 Edición aplicada solo al registro seleccionado
✅ CP-07 PENDIENTE -> EN_PROCESO aceptada
✅ EXTRA EN_PROCESO -> RESUELTA aceptada
✅ CP-09 Eliminación lógica y persistencia verificadas
✅ CP-08 RESUELTA -> PENDIENTE rechazada con 409
✅ CP-10 Búsqueda y filtros combinados correctamente
✅ CP-11 Identificadores inexistentes devuelven 404
✅ EXTRA Historial de estados registrado por trigger
✅ CP-12 Persistencia confirmada tras nueva consulta
✅ EXTRA Datos de prueba desactivados lógicamente

Resultado: 17/17 verificaciones correctas.
```

---

## Pruebas unitarias ejecutadas (salida real de `npm test`)

```
✔ las prioridades y estados permitidos son los definidos en el modelo
✔ CP-07: PENDIENTE -> EN_PROCESO es una transición válida
✔ CP-08: RESUELTA -> PENDIENTE es rechazada (estado final)
✔ CP-02: el backend rechaza un solicitante vacío
✔ CP-02: el solicitante debe tener al menos 3 caracteres
✔ CP-03: la descripción debe tener al menos 10 caracteres
✔ CP-04: se rechaza una prioridad incorrecta
✔ los datos válidos se normalizan recortando espacios
✔ el equipo debe ser un UUID válido
✔ el cambio de estado solo acepta los cuatro valores permitidos
✔ los filtros de lista combinan texto, prioridad y estado
✔ los filtros ilike escapan caracteres especiales

tests 12 | pass 12 | fail 0
```

---

## Notas

- Las pruebas E2E crean registros **reales** en Supabase y los desactivan
  lógicamente al terminar; no usan datos simulados. Quedaron 6 registros con
  `activo = FALSE` como evidencia de auditoría, sin afectar el listado habitual.
- El backend acepta indistintamente la clave nueva `sb_secret_...` de Supabase
  (`SUPABASE_SECRET_KEY`) o la legada `service_role` (`SUPABASE_SERVICE_ROLE_KEY`).
- Para repetir la verificación: iniciar la API con `npm start` y ejecutar
  `npm run verificar:api`.

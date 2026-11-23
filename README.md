# LabCare

**Sistema web de gestión de solicitudes de mantenimiento de equipos de laboratorio**  
Universidad Privada Domingo Savio (UPDS) — Desarrollo de Sistemas II

LabCare reemplaza el reporte de fallas por mensajes y hojas de cálculo por un
flujo web completo: registro, consulta, edición, búsqueda, filtros, cambio de
estado, eliminación lógica e historial, con persistencia real en **Supabase
(PostgreSQL)**.

> **Estado de la verificación:** conexión real con Supabase comprobada, 12/12
> casos de prueba ejecutados y aprobados, 12 pruebas unitarias en verde, build y
> lint sin errores. El detalle con respuestas HTTP y consultas a la base está en
> [`docs/INFORME_PRUEBAS.md`](docs/INFORME_PRUEBAS.md) y en la copia de la raíz
> [`INFORME_PRUEBAS.md`](INFORME_PRUEBAS.md).

---

## Tecnologías

### Frontend
- React 19 + Vite
- React Router 7
- Bootstrap 5
- Axios
- SweetAlert2
- Lucide React

### Backend
- Node.js + Express 5
- Arquitectura MVC/API por capas
- Zod (validaciones)
- `@supabase/supabase-js` (cliente oficial, solo en backend)
- Helmet + CORS + manejo centralizado de errores

### Base de datos
- Supabase / PostgreSQL
- Tablas: `equipos`, `solicitudes`, `historial_estados`, `contadores_codigo`
- Vista: `v_solicitudes_detalle`
- Restricciones, índices, triggers y RLS

---

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- npm 10 o superior
- Cuenta de Supabase con un proyecto creado

---

## Instalación

```bash
cd RESTAURANTE-CONTROL
npm install
cd frontend && npm install && cd ..
```

---

## Configuración de Supabase (pasos exactos)

1. Entra a https://supabase.com y crea un proyecto nuevo.
2. Espera a que el estado del proyecto sea **Active**.
3. En el menú lateral: **SQL Editor → New query**.
4. Abre `database/schema.sql` de este repositorio, copia **todo** el contenido
   y pégalo en el editor.
5. Haz clic en **Run**. Debe terminar sin errores.
6. Verifica en **Table Editor** que aparezcan las tablas `equipos`,
   `solicitudes`, `historial_estados` y `contadores_codigo`, y que `equipos`
   contenga los cuatro registros `EQ-001` … `EQ-004`.
7. Ve a **Project Settings → API Keys** y copia:
   - **Project URL** → `SUPABASE_URL`
   - **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY`  
     Si tu panel muestra las claves legadas, también sirve **service_role**
     (`eyJ...`) en `SUPABASE_SERVICE_ROLE_KEY`.  
     ⚠️ Nunca uses la clave **publishable**/`anon`: no tiene privilegios
     administrativos. El backend acepta una u otra automáticamente.

### Variables de entorno

Backend — copia `backend/.env.example` como `backend/.env`:

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SECRET_KEY=TU_SECRET_KEY_AQUI
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Frontend — copia `frontend/.env.example` como `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

> Los archivos `.env` están excluidos por `.gitignore`. La SERVICE_ROLE_KEY
> **nunca** se envía al navegador.

---

## Ejecución

Terminal 1 — API:

```bash
npm start          # o npm run dev
```

Debe mostrar: `[LabCare] API escuchando en http://localhost:3000/api`

Terminal 2 — Frontend:

```bash
npm run dev:frontend
```

Abre http://localhost:5173

### Comprobación rápida

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada cuando Supabase está bien configurado:

```json
{"success":true,"servicio":"LabCare API","supabase":"conectado","entorno":"development"}
```

Si devuelve `supabase: "sin conexión"`, revisa el SQL script ejecutado y las
credenciales de `backend/.env`.

---

## Funcionalidades

| Módulo | Qué permite |
|---|---|
| Dashboard | Totales, estados, prioridades, tasa de resolución y solicitudes recientes, todo consultado en Supabase |
| Equipos | Catálogo de los cuatro equipos iniciales con búsqueda por código, nombre o ubicación y detalle |
| Solicitudes | Registro con código automático `SOL-AAAAMMDD-XXX`, listado, detalle, edición, cambio de estado y eliminación lógica |
| Búsqueda y filtros | Búsqueda por código, solicitante o equipo + filtros por prioridad y estado, combinables e insensibles a mayúsculas |
| Historial | Todas las solicitudes (incluidas inactivas) y timeline de transiciones de estado |

### Reglas de negocio

- Solicitante: obligatorio, mínimo 3 caracteres (se recortan espacios).
- Descripción: obligatoria, mínimo 10 caracteres (se recortan espacios).
- Prioridad: `BAJA`, `MEDIA` o `ALTA`.
- Estado inicial: siempre `PENDIENTE`.
- Transiciones:
  - `PENDIENTE` → `EN_PROCESO` | `CANCELADA`
  - `EN_PROCESO` → `RESUELTA` | `CANCELADA`
  - `RESUELTA` y `CANCELADA` son finales.
- La edición no modifica ID, código, fecha de registro ni estado.
- Eliminar = `activo = FALSE`; el registro permanece en Supabase.
- El código se genera con `SELECT … FOR UPDATE` sobre un contador diario, por
  lo que no se duplica aunque dos personas registren al mismo tiempo.

---

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API y conexión con Supabase |
| GET | `/api/solicitudes` | Solicitudes activas (`q`, `prioridad`, `estado`) |
| GET | `/api/solicitudes/historial` | Todas las solicitudes |
| POST | `/api/solicitudes` | Registrar solicitud → 201 |
| GET | `/api/solicitudes/:id` | Detalle → 200 / 404 |
| PUT | `/api/solicitudes/:id` | Editar datos descriptivos |
| PATCH | `/api/solicitudes/:id/estado` | Cambiar estado (409 si transición inválida) |
| DELETE | `/api/solicitudes/:id` | Eliminación lógica |
| GET | `/api/solicitudes/:id/historial` | Transiciones de estado |
| GET | `/api/equipos` | Catálogo (`q` opcional) |
| GET | `/api/equipos/:id` | Detalle de equipo |
| GET | `/api/equipos/disponibles` | Catálogo para el selector del formulario |
| GET | `/api/dashboard/estadisticas` | Indicadores reales |

Respuestas consistentes:

```json
{ "success": true, "message": "…", "data": { } }
{ "success": false, "error": "…", "details": { } }
```

Códigos: 200, 201, 400, 404, 409, 500.

---

## Estructura del proyecto

```
RESTAURANTE-CONTROL/
├── database/schema.sql
├── backend/
│   ├── config/        env.js, supabase.js
│   ├── models/        solicitud.model.js
│   ├── repositories/  equipos, solicitudes, dashboard
│   ├── services/      equipos, solicitudes, dashboard
│   ├── controllers/   equipos, solicitudes, dashboard
│   ├── routes/        equipos, solicitudes, dashboard
│   ├── middlewares/   validate, errorHandler, notFound
│   ├── validators/    solicitud, equipos, comun
│   ├── utils/         ApiError, response, query, supabase, asyncHandler
│   ├── tests/         dominio.test.js
│   └── scripts/       verificar-api.js, auditoria-pruebas.js
├── frontend/src/
│   ├── layouts/       MainLayout, Sidebar, Topbar
│   ├── pages/         Dashboard, Solicitudes, Equipos, Historial, Documentacion, NotFound
│   ├── components/    StatCard, badges, modales, formularios, filtros…
│   ├── hooks/         useAsync, useSolicitudes, useEquipos
│   ├── services/      api, solicitudes, equipos, dashboard
│   ├── routes/        AppRoutes
│   ├── styles/        labcare.css
│   └── utils/         format, notificaciones
├── docs/              ANALISIS.md, CASOS_USO.puml, ARQUITECTURA.puml,
│                      MATRIZ_PRUEBAS.md, INFORME_PRUEBAS.md, capturas/,
│                      evidencias/
├── INFORME_PRUEBAS.md  (copia en raíz del informe de auditoría)
└── ANALISIS.md
```

### Nota sobre el proyecto previo

El directorio original contenía un sistema de **restaurante** con Firebase y un
archivo `serviceAccountKey.json` con credenciales incrustadas. Se retiró ese
código porque: (a) pertenece a otro dominio, (b) usaba Firestore en lugar de la
base relacional solicitada y (c) mantener credenciales en el repositorio es un
riesgo de seguridad. Se conservaron la estructura base de Express/Vite y
dependencias útiles como Axios, React Router y Lucide.

---

## Pruebas

```bash
npm test                 # 12 pruebas unitarias de dominio/validaciones
npm run verificar:api    # CP-01..CP-12 contra Supabase
npm run auditoria        # auditoría completa + evidencias en docs/evidencias/
```

Resultados detallados en [`docs/INFORME_PRUEBAS.md`](docs/INFORME_PRUEBAS.md)
y en [`docs/MATRIZ_PRUEBAS.md`](docs/MATRIZ_PRUEBAS.md).

La memoria completa del proyecto, la evidencia gráfica y las respuestas a la
evaluación teórica están en
[`DESARROLLO_COMPLETO_LABCARE.md`](DESARROLLO_COMPLETO_LABCARE.md). Las capturas
de interfaz se regeneran con `npm run capturas` y las de evidencia de pruebas con
`npm run capturas:pruebas` desde `frontend/` (requiere API y frontend en marcha).

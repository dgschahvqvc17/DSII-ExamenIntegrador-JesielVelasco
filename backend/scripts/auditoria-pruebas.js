/**
 * Auditoría ejecutable de los 12 casos de prueba del examen integrador.
 *
 * - Levanta las peticiones HTTP reales contra la API LabCare.
 * - Consulta Supabase directamente (service role, solo backend) para confirmar
 *   la persistencia de cada operación.
 * - Genera evidencias en docs/evidencias/ (JSON, HTML y log de ejecución).
 *
 * Uso: npm run auditoria   (requiere API y frontend en marcha)
 */
const fs = require('node:fs');
const path = require('node:path');
const supabase = require('../config/supabase');

const BASE = process.env.API_URL || 'http://localhost:3000/api';
const DIR_EVIDENCIAS = path.resolve(__dirname, '../../docs/evidencias');
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';
const SELLO = new Date().toISOString().replace(/[:.]/g, '-');

const resultados = [];
const traza = [];
const creados = [];

const escribir = (linea) => {
  console.log(linea);
  traza.push(linea);
};

const peticion = async (metodo, ruta, cuerpo) => {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const texto = await respuesta.text();
  let cuerpoRespuesta;
  try {
    cuerpoRespuesta = texto ? JSON.parse(texto) : null;
  } catch {
    cuerpoRespuesta = texto;
  }
  return {
    metodo,
    ruta,
    status: respuesta.status,
    body: cuerpoRespuesta,
    headers: {
      'access-control-allow-origin':
        respuesta.headers.get('access-control-allow-origin'),
      'x-content-type-options':
        respuesta.headers.get('x-content-type-options'),
    },
  };
};

const check = (condicion, mensaje) => {
  if (!condicion) throw new Error(mensaje);
};

const evHTTP = (evidencia, respuesta) =>
  evidencia.push({
    tipo: 'HTTP',
    titulo: `${respuesta.metodo} ${respuesta.ruta}`,
    estado: `HTTP ${respuesta.status}`,
    contenido: JSON.stringify(respuesta.body, null, 2),
  });

const evBD = (evidencia, titulo, consulta, datos) =>
  evidencia.push({
    tipo: 'SUPABASE',
    titulo,
    estado: 'Consulta directa',
    contenido: `${consulta}\n\n${JSON.stringify(datos, null, 2)}`,
  });

const ejecutarCP = async ({ id, descripcion, procedimiento, esperado, correr }) => {
  const evidencia = [];
  let obtenido = '';
  let estado = 'APROBADO';
  try {
    obtenido = await correr(evidencia);
  } catch (error) {
    estado = 'RECHAZADO';
    obtenido = `ERROR: ${error.message}`;
  }
  resultados.push({
    id,
    descripcion,
    procedimiento,
    esperado,
    obtenido,
    estado,
    evidencia,
  });
  escribir(
    `${estado === 'APROBADO' ? '✅' : '❌'} ${id} — ${descripcion}\n   Obtenido: ${obtenido}`,
  );
};

const ejecutar = async () => {
  fs.mkdirSync(DIR_EVIDENCIAS, { recursive: true });
  escribir('=== AUDITORÍA LABCARE — 23/11/2026 ===');
  escribir(`API: ${BASE}`);
  escribir(`Supabase: ${process.env.SUPABASE_URL || 'backend/.env'}\n`);

  // ---------- SETUP ----------
  const salud = await peticion('GET', '/health');
  check(salud.status === 200, 'El health check no respondió 200');
  check(salud.body.supabase === 'conectado', 'Supabase no está conectado');
  const equiposResp = await peticion('GET', '/equipos');
  check(equiposResp.status === 200, 'GET /equipos falló');
  check(equiposResp.body.data.length === 4, 'El catálogo no tiene 4 equipos');
  const { data: equiposBD, error: errorEquipos } = await supabase
    .from('equipos')
    .select('codigo, nombre, ubicacion, estado')
    .order('codigo');
  check(!errorEquipos, 'Consulta directa a equipos falló');
  check(equiposBD.length === 4, 'Supabase no devolvió 4 equipos');
  const equipoId = equiposResp.body.data[0].id;
  escribir('✅ SETUP — API y Supabase conectados; 4 equipos verificados en BD.\n');

  const base = {
    equipo_id: equipoId,
    solicitante: `Auditoría CP-01 ${SELLO}`,
    descripcion: 'El equipo no enciende desde esta mañana en el laboratorio',
    prioridad: 'MEDIA',
  };

  let solicitud;
  let original;
  let idTercera;

  // ---------- CP-01 ----------
  await ejecutarCP({
    id: 'CP-01',
    descripcion: 'Registrar solicitud con datos válidos',
    procedimiento: 'POST /api/solicitudes con equipo existente, solicitante, descripción y prioridad MEDIA; después SELECT por id en Supabase.',
    esperado: 'HTTP 201, estado PENDIENTE, activo TRUE y código SOL-AAAAMMDD-XXX único persistido.',
    correr: async (evidencia) => {
      const respuesta = await peticion('POST', '/solicitudes', base);
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 201, `Esperado 201, obtenido ${respuesta.status}`);
      solicitud = respuesta.body.data;
      check(solicitud.estado === 'PENDIENTE', 'Estado inicial no es PENDIENTE');
      check(solicitud.activo === true, 'activo no es TRUE');
      check(/^SOL-\d{8}-\d{3}$/.test(solicitud.codigo_solicitud), 'Código con formato inválido');
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id, codigo_solicitud, solicitante, estado, activo, fecha_registro')
        .eq('id', solicitud.id)
        .single();
      check(!error, 'No se pudo consultar la solicitud en Supabase');
      evBD(evidencia, 'SELECT en solicitudes por id', `.eq('id', '${solicitud.id}')`, data);
      check(data.codigo_solicitud === solicitud.codigo_solicitud, 'El código no coincide en BD');
      check(data.estado === 'PENDIENTE' && data.activo === true, 'El estado/activo no coinciden en BD');
      creados.push(solicitud.id);
      return `201 — ${solicitud.codigo_solicitud}, PENDIENTE, activo TRUE; confirmado en Supabase.`;
    },
  });

  // ---------- CP-02 ----------
  await ejecutarCP({
    id: 'CP-02',
    descripcion: 'Registrar solicitante vacío',
    procedimiento: 'POST /api/solicitudes con solicitante "   "; posterior SELECT por marcador único en Supabase.',
    esperado: 'HTTP 400 con mensaje de longitud mínima y ninguna fila insertada.',
    correr: async (evidencia) => {
      const marca = `CP02-${SELLO}`;
      const respuesta = await peticion('POST', '/solicitudes', {
        ...base,
        solicitante: '   ',
        descripcion: `Descripción de auditoría ${marca}`,
      });
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 400, `Esperado 400, obtenido ${respuesta.status}`);
      check(
        /solicitante/i.test(JSON.stringify(respuesta.body)),
        'El error no menciona el campo solicitante',
      );
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id')
        .eq('descripcion', `Descripción de auditoría ${marca}`);
      check(!error, 'Consulta de verificación falló');
      evBD(evidencia, 'SELECT por marcador CP-02', `.eq('descripcion', '...${marca}')`, { filas: data.length });
      check(data.length === 0, 'Se insertó una fila con solicitante vacío');
      return '400 — rechazado por Zod; 0 filas nuevas en Supabase.';
    },
  });

  // ---------- CP-03 ----------
  await ejecutarCP({
    id: 'CP-03',
    descripcion: 'Registrar descripción con menos de 10 caracteres',
    procedimiento: 'POST /api/solicitudes con descripción "Falla" y solicitante único; SELECT por ese solicitante en Supabase.',
    esperado: 'HTTP 400 y ninguna fila insertada.',
    correr: async (evidencia) => {
      const solicitante = `Auditoría CP03 ${SELLO}`;
      const respuesta = await peticion('POST', '/solicitudes', {
        ...base,
        solicitante,
        descripcion: 'Falla',
      });
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 400, `Esperado 400, obtenido ${respuesta.status}`);
      check(/descripción/i.test(JSON.stringify(respuesta.body)), 'El error no menciona la descripción');
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id')
        .eq('solicitante', solicitante);
      check(!error, 'Consulta de verificación falló');
      evBD(evidencia, 'SELECT por solicitante CP-03', `.eq('solicitante', '${solicitante}')`, { filas: data.length });
      check(data.length === 0, 'Se insertó una fila con descripción corta');
      return '400 — rechazado; 0 filas nuevas en Supabase.';
    },
  });

  // ---------- CP-04 ----------
  await ejecutarCP({
    id: 'CP-04',
    descripcion: 'Enviar prioridad incorrecta',
    procedimiento: 'POST /api/solicitudes con prioridad "URGENTE" y solicitante único; SELECT por ese solicitante.',
    esperado: 'HTTP 400 indicando BAJA/MEDIA/ALTA y ninguna fila insertada.',
    correr: async (evidencia) => {
      const solicitante = `Auditoría CP04 ${SELLO}`;
      const respuesta = await peticion('POST', '/solicitudes', {
        ...base,
        solicitante,
        prioridad: 'URGENTE',
      });
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 400, `Esperado 400, obtenido ${respuesta.status}`);
      check(/prioridad/i.test(JSON.stringify(respuesta.body)), 'El error no menciona la prioridad');
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id')
        .eq('solicitante', solicitante);
      check(!error, 'Consulta de verificación falló');
      evBD(evidencia, 'SELECT por solicitante CP-04', `.eq('solicitante', '${solicitante}')`, { filas: data.length });
      check(data.length === 0, 'Se insertó una fila con prioridad inválida');
      return '400 — rechazado; 0 filas nuevas en Supabase.';
    },
  });

  // ---------- CP-05 ----------
  await ejecutarCP({
    id: 'CP-05',
    descripcion: 'Seleccionar equipo inexistente',
    procedimiento: `POST /api/solicitudes con equipo_id ${UUID_INEXISTENTE}; SELECT por solicitante único.`,
    esperado: 'HTTP 404 y ninguna fila insertada (FK y validación del servicio).',
    correr: async (evidencia) => {
      const solicitante = `Auditoría CP05 ${SELLO}`;
      const respuesta = await peticion('POST', '/solicitudes', {
        ...base,
        solicitante,
        equipo_id: UUID_INEXISTENTE,
      });
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 404, `Esperado 404, obtenido ${respuesta.status}`);
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id')
        .eq('solicitante', solicitante);
      check(!error, 'Consulta de verificación falló');
      evBD(evidencia, 'SELECT por solicitante CP-05', `.eq('solicitante', '${solicitante}')`, { filas: data.length });
      check(data.length === 0, 'Se insertó una fila con equipo inexistente');
      return '404 — rechazado; 0 filas nuevas en Supabase.';
    },
  });

  // ---------- CP-06 ----------
  await ejecutarCP({
    id: 'CP-06',
    descripcion: 'Editar una solicitud',
    procedimiento: 'PUT /api/solicitudes/:id cambiando equipo, solicitante, descripción y prioridad; SELECT por id antes y después.',
    esperado: 'HTTP 200; solo cambia el registro seleccionado; ID, código, fecha_registro y estado permanecen intactos.',
    correr: async (evidencia) => {
      const { data: antes, error: errorAntes } = await supabase
        .from('solicitudes')
        .select('id, codigo_solicitud, solicitante, prioridad, estado, fecha_registro, fecha_actualizacion')
        .eq('id', solicitud.id)
        .single();
      check(!errorAntes, 'No se pudo leer el estado previo');
      const editada = {
        equipo_id: equiposResp.body.data[1].id,
        solicitante: `Auditoría CP06 editada ${SELLO}`,
        descripcion: 'El proyector presenta fallas intermitentes de imagen y sonido',
        prioridad: 'ALTA',
      };
      const respuesta = await peticion('PUT', `/solicitudes/${solicitud.id}`, editada);
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 200, `Esperado 200, obtenido ${respuesta.status}`);
      const { data: despues, error: errorDespues } = await supabase
        .from('solicitudes')
        .select('id, codigo_solicitud, solicitante, descripcion, prioridad, equipo_id, estado, fecha_registro, fecha_actualizacion')
        .eq('id', solicitud.id)
        .single();
      check(!errorDespues, 'No se pudo leer el estado posterior');
      evBD(evidencia, 'SELECT antes y después de PUT', `.eq('id', '${solicitud.id}')`, { antes, despues });
      check(despues.solicitante === editada.solicitante, 'El solicitante no se actualizó');
      check(despues.prioridad === 'ALTA', 'La prioridad no se actualizó');
      check(despues.equipo_id === editada.equipo_id, 'El equipo no se actualizó');
      check(despues.codigo_solicitud === antes.codigo_solicitud, 'El código cambió');
      check(despues.fecha_registro === antes.fecha_registro, 'La fecha de registro cambió');
      check(despues.estado === antes.estado, 'El estado cambió durante la edición');
      check(despues.fecha_actualizacion !== antes.fecha_actualizacion, 'El trigger no actualizó fecha_actualizacion');
      const { data: mismosDatos, error: errorDuplicados } = await supabase
        .from('solicitudes')
        .select('id')
        .eq('codigo_solicitud', solicitud.codigo_solicitud);
      check(!errorDuplicados, 'No se pudo verificar unicidad');
      evBD(evidencia, 'Unicidad del código', `.eq('codigo_solicitud', '${solicitud.codigo_solicitud}')`, { filas: mismosDatos.length });
      check(mismosDatos.length === 1, 'El código dejó de ser único');
      original = antes;
      return '200 — registro editado; ID, código, fecha_registro y estado conservados en BD.';
    },
  });

  // ---------- CP-07 ----------
  await ejecutarCP({
    id: 'CP-07',
    descripcion: 'Cambiar de PENDIENTE a EN_PROCESO',
    procedimiento: 'PATCH /api/solicitudes/:id/estado con EN_PROCESO; SELECT en solicitudes e historial_estados.',
    esperado: 'HTTP 200, estado EN_PROCESO y transición registrada por trigger.',
    correr: async (evidencia) => {
      const respuesta = await peticion('PATCH', `/solicitudes/${solicitud.id}/estado`, {
        estado: 'EN_PROCESO',
      });
      evHTTP(evidencia, respuesta);
      check(respuesta.status === 200, `Esperado 200, obtenido ${respuesta.status}`);
      const { data: fila } = await supabase
        .from('solicitudes')
        .select('estado')
        .eq('id', solicitud.id)
        .single();
      const { data: historial, error: errorHistorial } = await supabase
        .from('historial_estados')
        .select('estado_anterior, estado_nuevo, fecha_cambio')
        .eq('solicitud_id', solicitud.id)
        .order('fecha_cambio');
      check(!errorHistorial, 'No se pudo consultar el historial');
      evBD(evidencia, 'SELECT en solicitudes e historial_estados', `.eq('id', '${solicitud.id}')`, { fila, historial });
      check(fila.estado === 'EN_PROCESO', 'La BD no refleja EN_PROCESO');
      check(
        historial.some((h) => h.estado_anterior === 'PENDIENTE' && h.estado_nuevo === 'EN_PROCESO'),
        'El trigger no registró la transición',
      );
      return '200 — EN_PROCESO persistido y transición registrada en historial_estados.';
    },
  });

  // ---------- CP-08 ----------
  await ejecutarCP({
    id: 'CP-08',
    descripcion: 'Cambiar de RESUELTA a PENDIENTE',
    procedimiento: 'PATCH a RESUELTA (válida) y luego PATCH a PENDIENTE (inválida); SELECT de estado e historial.',
    esperado: 'Segunda petición HTTP 409; el registro permanece RESUELTA y no se agrega historial.',
    correr: async (evidencia) => {
      const resolucion = await peticion('PATCH', `/solicitudes/${solicitud.id}/estado`, {
        estado: 'RESUELTA',
      });
      evHTTP(evidencia, resolucion);
      check(resolucion.status === 200, 'No se pudo llevar la solicitud a RESUELTA');
      const { data: histAntes } = await supabase
        .from('historial_estados')
        .select('id')
        .eq('solicitud_id', solicitud.id);
      const retroceso = await peticion('PATCH', `/solicitudes/${solicitud.id}/estado`, {
        estado: 'PENDIENTE',
      });
      evHTTP(evidencia, retroceso);
      check(retroceso.status === 409, `Esperado 409, obtenido ${retroceso.status}`);
      const { data: fila } = await supabase
        .from('solicitudes')
        .select('estado')
        .eq('id', solicitud.id)
        .single();
      const { data: histDespues } = await supabase
        .from('historial_estados')
        .select('id')
        .eq('solicitud_id', solicitud.id);
      evBD(evidencia, 'SELECT de estado e historial tras rechazo', `.eq('id', '${solicitud.id}')`, {
        estado: fila.estado,
        historial_antes: histAntes.length,
        historial_despues: histDespues.length,
      });
      check(fila.estado === 'RESUELTA', 'La solicitud cambió de estado pese al rechazo');
      check(histDespues.length === histAntes.length, 'Se registró una transición inválida');
      return '409 — transición rechazada; estado RESUELTA e historial sin cambios.';
    },
  });

  // ---------- CP-09 ----------
  await ejecutarCP({
    id: 'CP-09',
    descripcion: 'Eliminar lógicamente una solicitud',
    procedimiento: 'DELETE /api/solicitudes/:id; GET /solicitudes y /solicitudes/historial; SELECT directo por id para comprobar que la fila sigue existiendo con activo FALSE.',
    esperado: 'HTTP 200; ausente del listado habitual, presente en historial y en Supabase con activo FALSE.',
    correr: async (evidencia) => {
      const borrado = await peticion('DELETE', `/solicitudes/${solicitud.id}`);
      evHTTP(evidencia, borrado);
      check(borrado.status === 200, `Esperado 200, obtenido ${borrado.status}`);
      const listado = await peticion('GET', '/solicitudes');
      const historialAPI = await peticion('GET', '/solicitudes/historial');
      evHTTP(evidencia, listado);
      evHTTP(evidencia, historialAPI);
      check(!listado.body.data.some((s) => s.id === solicitud.id), 'Sigue en el listado activo');
      check(historialAPI.body.data.some((s) => s.id === solicitud.id), 'No aparece en el historial');
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id, codigo_solicitud, activo')
        .eq('id', solicitud.id)
        .single();
      check(!error, 'La fila desapareció físicamente de Supabase');
      evBD(evidencia, 'SELECT directo tras DELETE', `.eq('id', '${solicitud.id}')`, data);
      check(data.activo === false, 'activo no es FALSE en Supabase');
      return '200 — fuera del listado, presente en historial y activo FALSE en Supabase.';
    },
  });

  // ---------- CP-10 ----------
  await ejecutarCP({
    id: 'CP-10',
    descripcion: 'Buscar por solicitante/equipo y filtrar por prioridad y estado',
    procedimiento: 'Crear solicitud única; GET /solicitudes con q, prioridad y estado; GET con búsqueda sin coincidencias; SELECT directo con ilike.',
    esperado: 'Coincidencias correctas combinando filtros y lista vacía cuando no hay coincidencias.',
    correr: async (evidencia) => {
      const solicitante = `Auditoría CP10 ${SELLO}`;
      const creada = await peticion('POST', '/solicitudes', {
        ...base,
        solicitante,
        descripcion: 'La impresora no responde al enviar trabajos desde el laboratorio',
        prioridad: 'BAJA',
      });
      evHTTP(evidencia, creada);
      check(creada.status === 201, 'No se pudo crear la solicitud de filtros');
      const id = creada.body.data.id;
      creados.push(id);
      idTercera = id;
      const filtrada = await peticion(
        'GET',
        `/solicitudes?q=${encodeURIComponent(solicitante)}&prioridad=BAJA&estado=PENDIENTE`,
      );
      const porEquipo = await peticion(
        'GET',
        `/solicitudes?q=${encodeURIComponent(equiposResp.body.data[0].nombre)}&prioridad=BAJA`,
      );
      const sinCoincidencias = await peticion(
        'GET',
        '/solicitudes?q=NoExiste123456&prioridad=ALTA',
      );
      evHTTP(evidencia, filtrada);
      evHTTP(evidencia, porEquipo);
      evHTTP(evidencia, sinCoincidencias);
      check(filtrada.body.data.some((s) => s.id === id), 'No apareció con los filtros combinados');
      check(porEquipo.body.data.some((s) => s.id === id), 'No se pudo buscar por nombre de equipo');
      check(sinCoincidencias.body.data.length === 0, 'La búsqueda negativa devolvió filas');
      const { data: db, error } = await supabase
        .from('solicitudes')
        .select('id, solicitante, prioridad, estado')
        .ilike('solicitante', `%${solicitante}%`)
        .eq('prioridad', 'BAJA')
        .eq('estado', 'PENDIENTE');
      check(!error, 'Consulta directa con filtros falló');
      evBD(evidencia, 'SELECT con ilike + prioridad + estado', '.ilike(solicitante).eq(prioridad).eq(estado)', db);
      check(db.some((s) => s.id === id), 'La consulta directa no encontró el registro');
      return `200 — ${filtrada.body.data.length} coincidencia(s) combinada(s); búsqueda por equipo y filtro negativo correctos.`;
    },
  });

  // ---------- CP-11 ----------
  await ejecutarCP({
    id: 'CP-11',
    descripcion: 'Consultar o editar un identificador inexistente',
    procedimiento: `GET y PUT /api/solicitudes/${UUID_INEXISTENTE}.`,
    esperado: 'HTTP 404 controlado en ambas operaciones, sin excepciones internas.',
    correr: async (evidencia) => {
      const detalle = await peticion('GET', `/solicitudes/${UUID_INEXISTENTE}`);
      const edicion = await peticion('PUT', `/solicitudes/${UUID_INEXISTENTE}`, base);
      evHTTP(evidencia, detalle);
      evHTTP(evidencia, edicion);
      check(detalle.status === 404, `GET devolvió ${detalle.status}`);
      check(edicion.status === 404, `PUT devolvió ${edicion.status}`);
      check(detalle.body.success === false, 'La respuesta de error no es consistente');
      return '404 — GET y PUT controlados con JSON {success:false, error:...}.';
    },
  });

  // ---------- CP-12 ----------
  await ejecutarCP({
    id: 'CP-12',
    descripcion: 'Persistencia después de recargar la aplicación',
    procedimiento: 'Nueva petición GET (equivalente a recargar el navegador) tras los cambios; SELECT directo por id en Supabase.',
    esperado: 'HTTP 200 con los mismos datos almacenados y fila presente en Supabase.',
    correr: async (evidencia) => {
      const recargada = await peticion('GET', `/solicitudes/${idTercera}`);
      const listado = await peticion('GET', '/solicitudes');
      evHTTP(evidencia, recargada);
      evHTTP(evidencia, listado);
      check(recargada.status === 200, `Esperado 200, obtenido ${recargada.status}`);
      check(recargada.body.data.solicitante === `Auditoría CP10 ${SELLO}`, 'Los datos cambiaron tras la recarga');
      check(listado.body.data.some((s) => s.id === idTercera), 'El registro desapareció del listado');
      const { data, error } = await supabase
        .from('solicitudes')
        .select('id, codigo_solicitud, solicitante, prioridad, estado, activo')
        .eq('id', idTercera)
        .single();
      check(!error, 'La fila no está en Supabase');
      evBD(evidencia, 'SELECT tras recarga', `.eq('id', '${idTercera}')`, data);
      check(data.activo === true, 'El registro activo cambió');
      return `200 — ${data.codigo_solicitud} disponible tras recarga y confirmado en Supabase.`;
    },
  });

  // Limpieza lógica de los registros creados por la auditoría.
  for (const id of creados) {
    await peticion('DELETE', `/solicitudes/${id}`);
  }
  escribir(`\n🧹 Limpieza lógica aplicada a ${creados.length} registros de auditoría.\n`);

  // ---------- VERIFICACIÓN FINAL EN BASE DE DATOS ----------
  const { data: total, error: e1 } = await supabase.from('solicitudes').select('id, activo, estado, prioridad');
  const { data: historial, error: e2 } = await supabase.from('historial_estados').select('id, solicitud_id, estado_anterior, estado_nuevo');
  const { data: contador, error: e3 } = await supabase.from('contadores_codigo').select('fecha, ultimo').order('fecha', { ascending: false }).limit(1);
  check(!e1 && !e2 && !e3, 'Falló la verificación final de Supabase');
  const resumenBD = {
    equipos: equiposBD.length,
    solicitudes_totales: total.length,
    solicitudes_activas: total.filter((s) => s.activo).length,
    solicitudes_inactivas: total.filter((s) => !s.activo).length,
    filas_historial: historial.length,
    ultimo_contador: contador[0] || null,
  };

  const aprobadas = resultados.filter((r) => r.estado === 'APROBADO').length;
  const rechazadas = resultados.length - aprobadas;
  const payload = {
    fecha: new Date().toISOString(),
    api: BASE,
    supabase: process.env.SUPABASE_URL || 'backend/.env',
    resumen: { total: resultados.length, aprobadas, rechazadas, pendientes: 0 },
    resultados,
    verificadoEnBaseDeDatos: resumenBD,
    limpieza: { registrosDesactivados: creados.length },
    traza,
  };

  fs.writeFileSync(
    path.join(DIR_EVIDENCIAS, 'resultados-auditoria.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  generarHTML(payload, DIR_EVIDENCIAS);

  escribir('=== RESUMEN ===');
  escribir(`APROBADAS: ${aprobadas} | RECHAZADAS: ${rechazadas} | PENDIENTES: 0`);
  if (rechazadas) process.exitCode = 1;
};

const esc = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const tarjetaCP = (r) => `
  <section class="cp" id="${r.id.toLowerCase()}">
    <h3><span class="pill ${r.estado === 'APROBADO' ? 'ok' : 'bad'}">${r.estado}</span> ${r.id} — ${esc(r.descripcion)}</h3>
    <p><b>Procedimiento:</b> ${esc(r.procedimiento)}</p>
    <p><b>Esperado:</b> ${esc(r.esperado)}</p>
    <p><b>Obtenido:</b> ${esc(r.obtenido)}</p>
    ${r.evidencia.map((e) => `
      <div class="evidence">
        <div class="evidence-title">${esc(e.tipo)} · ${esc(e.titulo)} · <span>${esc(e.estado)}</span></div>
        <pre>${esc(e.contenido)}</pre>
      </div>`).join('')}
  </section>`;

const generarHTML = (payload, dir) => {
  const filas = payload.resultados
    .map(
      (r) => `<tr><td>${r.id}</td><td>${esc(r.descripcion)}</td><td>${esc(r.obtenido)}</td><td><span class="pill ${r.estado === 'APROBADO' ? 'ok' : 'bad'}">${r.estado}</span></td></tr>`,
    )
    .join('');
  const grupos = [0, 4, 8]
    .map(
      (ini, i) =>
        `<div id="grupo-${i + 1}">${payload.resultados.slice(ini, ini + 4).map(tarjetaCP).join('')}</div>`,
    )
    .join('');
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Evidencia de pruebas LabCare</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;background:#f4f7fb;color:#16283f;margin:0;padding:24px}
  h1{color:#123a6b;margin:0 0 4px}h2{color:#123a6b;margin-top:28px}
  .header{background:#123a6b;color:#fff;padding:20px;border-radius:10px;margin-bottom:20px}
  .header p{color:#d7e6f7;margin:4px 0}
  .pill{display:inline-block;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700}
  .ok{background:#d1fae5;color:#065f46}.bad{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
  th,td{padding:10px;border-bottom:1px solid #dbe5f0;text-align:left;font-size:13px;vertical-align:top}
  th{background:#e8f0fa;color:#123a6b}
  .cp{background:#fff;border:1px solid #dbe5f0;border-radius:10px;padding:16px;margin:14px 0}
  .cp h3{margin:0 0 10px;font-size:16px}.cp p{font-size:13px;margin:6px 0}
  .evidence{border-left:4px solid #2f6fb5;background:#f8fbff;padding:10px;margin-top:10px}
  .evidence-title{font-weight:700;color:#123a6b;font-size:12px}
  pre{white-space:pre-wrap;word-break:break-word;font-size:11px;background:#0f233b;color:#d6e8ff;padding:12px;border-radius:6px;max-height:420px;overflow:auto}
  .section{background:#fff;border:1px solid #dbe5f0;border-radius:10px;padding:16px}
</style></head><body>
<div class="header"><h1>LabCare — Evidencia de ejecución de pruebas</h1>
<p>Fecha: ${esc(payload.fecha)}</p><p>API: ${esc(payload.api)}</p>
<p>Resumen: ${payload.resumen.aprobadas}/${payload.resumen.total} aprobadas · ${payload.resumen.rechazadas} rechazadas · ${payload.resumen.pendientes} pendientes</p></div>
<h2>Tabla de resultados</h2>
<table id="resumen"><thead><tr><th>ID</th><th>Descripción</th><th>Resultado obtenido</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table>
<h2>Detalle y respuestas HTTP</h2>${grupos}
<h2>Verificación directa en Supabase</h2>
<div id="verificacion-db" class="section"><pre>${esc(JSON.stringify(payload.verificadoEnBaseDeDatos, null, 2))}</pre>
<p><b>Limpieza:</b> ${payload.limpieza.registrosDesactivados} registros de auditoría desactivados lógicamente.</p></div>
</body></html>`;
  fs.writeFileSync(path.join(dir, 'evidencia-pruebas.html'), html, 'utf8');
};

ejecutar().catch((error) => {
  console.error('\n❌ Auditoría detenida:', error.message);
  console.error(error.stack);
  process.exit(1);
});

/**
 * Verificación de extremo a extremo (CP-01 .. CP-12) contra la API en marcha.
 * Requiere backend/.env configurado y el servidor ejecutándose.
 *
 *   node backend/scripts/verificar-api.js
 *
 * NO usa datos simulados: crea registros reales en Supabase y los elimina
 * lógicamente al finalizar.
 */
const assert = require('node:assert/strict');

const BASE = process.env.API_URL || 'http://localhost:3000/api';
const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

const resultados = [];

const peticion = async (metodo, ruta, body) => {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { status: respuesta.status, datos };
};

const registrar = (codigo, descripcion, ok, detalle = '') => {
  resultados.push({ codigo, descripcion, ok, detalle });
  console.log(
    `${ok ? '✅' : '❌'} ${codigo} ${descripcion}${detalle ? ` — ${detalle}` : ''}`,
  );
};

const verificar = async () => {
  console.log(`Verificando API en ${BASE}\n`);

  const salud = await peticion('GET', '/health');
  assert.equal(salud.status, 200, 'La API o Supabase no están disponibles');
  assert.equal(salud.datos.supabase, 'conectado');
  registrar('SETUP', 'API y Supabase conectados', true);

  const equipos = await peticion('GET', '/equipos');
  assert.equal(equipos.status, 200);
  assert.ok(equipos.datos.data.length >= 4);
  const equipoId = equipos.datos.data[0].id;
  registrar('SETUP', `Catálogo leído (${equipos.datos.data.length} equipos)`, true);

  const base = {
    equipo_id: equipoId,
    solicitante: 'María Prueba LabCare',
    descripcion: 'El equipo no enciende desde esta mañana',
    prioridad: 'MEDIA',
  };

  // CP-01
  const creada = await peticion('POST', '/solicitudes', base);
  assert.equal(creada.status, 201);
  const solicitud = creada.datos.data;
  assert.equal(solicitud.estado, 'PENDIENTE');
  assert.equal(solicitud.activo, true);
  assert.match(solicitud.codigo_solicitud, /^SOL-\d{8}-\d{3}$/);
  registrar('CP-01', 'Registro válido con código y estado PENDIENTE', true, solicitud.codigo_solicitud);

  // CP-02
  const sinSolicitante = await peticion('POST', '/solicitudes', {
    ...base,
    solicitante: '   ',
  });
  assert.equal(sinSolicitante.status, 400);
  registrar('CP-02', 'Solicitante vacío rechazado', true);

  // CP-03
  const descripcionCorta = await peticion('POST', '/solicitudes', {
    ...base,
    descripcion: 'Falla',
  });
  assert.equal(descripcionCorta.status, 400);
  registrar('CP-03', 'Descripción menor a 10 caracteres rechazada', true);

  // CP-04
  const prioridadMala = await peticion('POST', '/solicitudes', {
    ...base,
    prioridad: 'URGENTE',
  });
  assert.equal(prioridadMala.status, 400);
  registrar('CP-04', 'Prioridad incorrecta rechazada', true);

  // CP-05
  const equipoInexistente = await peticion('POST', '/solicitudes', {
    ...base,
    equipo_id: UUID_INEXISTENTE,
  });
  assert.equal(equipoInexistente.status, 404);
  registrar('CP-05', 'Equipo inexistente rechazado', true);

  // CP-06
  const editada = await peticion('PUT', `/solicitudes/${solicitud.id}`, {
    equipo_id: equipoId,
    solicitante: 'María Editada LabCare',
    descripcion: 'El proyector presenta fallas intermitentes de imagen',
    prioridad: 'ALTA',
  });
  assert.equal(editada.status, 200);
  assert.equal(editada.datos.data.solicitante, 'María Editada LabCare');
  assert.equal(editada.datos.data.codigo_solicitud, solicitud.codigo_solicitud);
  registrar('CP-06', 'Edición aplicada solo al registro seleccionado', true);

  // CP-07
  const enProceso = await peticion('PATCH', `/solicitudes/${solicitud.id}/estado`, {
    estado: 'EN_PROCESO',
  });
  assert.equal(enProceso.status, 200);
  assert.equal(enProceso.datos.data.estado, 'EN_PROCESO');
  registrar('CP-07', 'PENDIENTE -> EN_PROCESO aceptada', true);

  // Segunda transición para verificar el trigger de historial
  const resueltaPrimera = await peticion(
    'PATCH',
    `/solicitudes/${solicitud.id}/estado`,
    { estado: 'RESUELTA' },
  );
  assert.equal(resueltaPrimera.status, 200);
  registrar('EXTRA', 'EN_PROCESO -> RESUELTA aceptada', true);

  // CP-09
  const eliminada = await peticion('DELETE', `/solicitudes/${solicitud.id}`);
  assert.equal(eliminada.status, 200);
  const listadoTrasBorrado = await peticion('GET', '/solicitudes');
  assert.ok(
    !listadoTrasBorrado.datos.data.some((s) => s.id === solicitud.id),
  );
  const historialTrasBorrado = await peticion('GET', '/solicitudes/historial');
  const persistence = historialTrasBorrado.datos.data.find(
    (s) => s.id === solicitud.id,
  );
  assert.ok(persistence, 'El registro debe permanecer en Supabase');
  assert.equal(persistence.activo, false);
  registrar('CP-09', 'Eliminación lógica y persistencia verificadas', true);

  // CP-08 (necesita llevar otra solicitud a RESUELTA)
  const segunda = await peticion('POST', '/solicitudes', {
    ...base,
    solicitante: 'Carlos Transición',
    descripcion: ' Router sin conexión intermitente en el laboratorio',
  });
  assert.equal(segunda.status, 201);
  const idSegunda = segunda.datos.data.id;
  await peticion('PATCH', `/solicitudes/${idSegunda}/estado`, {
    estado: 'EN_PROCESO',
  });
  const resuelta = await peticion('PATCH', `/solicitudes/${idSegunda}/estado`, {
    estado: 'RESUELTA',
  });
  assert.equal(resuelta.status, 200);
  const retroceso = await peticion('PATCH', `/solicitudes/${idSegunda}/estado`, {
    estado: 'PENDIENTE',
  });
  assert.equal(retroceso.status, 409);
  registrar('CP-08', 'RESUELTA -> PENDIENTE rechazada con 409', true);

  // CP-10
  const tercera = await peticion('POST', '/solicitudes', {
    ...base,
    solicitante: 'Ana Filtros UPDS',
    descripcion: 'La impresora no responde al enviar trabajos',
    prioridad: 'BAJA',
  });
  assert.equal(tercera.status, 201);
  const idTercera = tercera.datos.data.id;
  const filtradas = await peticion(
    'GET',
    '/solicitudes?q=Ana%20Filtros&prioridad=BAJA&estado=PENDIENTE',
  );
  assert.equal(filtradas.status, 200);
  assert.ok(filtradas.datos.data.some((s) => s.id === idTercera));
  const sinCoincidencias = await peticion(
    'GET',
    '/solicitudes?q=NoExiste123456&prioridad=ALTA',
  );
  assert.equal(sinCoincidencias.datos.data.length, 0);
  registrar('CP-10', 'Búsqueda y filtros combinados correctamente', true);

  // CP-11
  const detalleInexistente = await peticion(
    'GET',
    `/solicitudes/${UUID_INEXISTENTE}`,
  );
  assert.equal(detalleInexistente.status, 404);
  const edicionInexistente = await peticion(
    'PUT',
    `/solicitudes/${UUID_INEXISTENTE}`,
    base,
  );
  assert.equal(edicionInexistente.status, 404);
  registrar('CP-11', 'Identificadores inexistentes devuelven 404', true);

  // Historial de transiciones
  const transiciones = await peticion(
    'GET',
    `/solicitudes/${solicitud.id}/historial`,
  );
  assert.equal(transiciones.status, 200);
  assert.ok(transiciones.datos.data.transiciones.length >= 2);
  registrar('EXTRA', 'Historial de estados registrado por trigger', true);

  // CP-12
  const recargada = await peticion('GET', `/solicitudes/${idTercera}`);
  assert.equal(recargada.status, 200);
  assert.equal(recargada.datos.data.solicitante, 'Ana Filtros UPDS');
  registrar('CP-12', 'Persistencia confirmada tras nueva consulta', true);

  // Limpieza lógica de los registros de prueba restantes
  await peticion('DELETE', `/solicitudes/${idSegunda}`);
  await peticion('DELETE', `/solicitudes/${idTercera}`);
  registrar('EXTRA', 'Datos de prueba desactivados lógicamente', true);

  const fallidos = resultados.filter((r) => !r.ok);
  console.log(
    `\nResultado: ${resultados.length - fallidos.length}/${resultados.length} verificaciones correctas.`,
  );
  if (fallidos.length) process.exit(1);
};

verificar().catch((error) => {
  console.error('\n❌ Verificación detenida:', error.message);
  console.error(
    'Revisa backend/.env, que el script SQL fue ejecutado y que el servidor está activo.',
  );
  process.exit(1);
});

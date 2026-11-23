const test = require('node:test');
const assert = require('node:assert/strict');

const {
  esTransicionPermitida,
  TRANSICIONES_PERMITIDAS,
  PRIORIDADES,
  ESTADOS,
} = require('../models/solicitud.model');
const {
  crearSolicitudSchema,
  cambiarEstadoSchema,
  listarSolicitudesSchema,
} = require('../validators/solicitud.validator');
const { filtroIlike } = require('../utils/query');

const UUID = '11111111-1111-4111-8111-111111111111';
const datosValidos = {
  equipo_id: UUID,
  solicitante: '  Juan Pérez  ',
  descripcion: '   El equipo no enciende desde esta mañana   ',
  prioridad: 'MEDIA',
};

test('las prioridades y estados permitidos son los definidos en el modelo', () => {
  assert.deepEqual([...PRIORIDADES], ['BAJA', 'MEDIA', 'ALTA']);
  assert.deepEqual([...ESTADOS], [
    'PENDIENTE',
    'EN_PROCESO',
    'RESUELTA',
    'CANCELADA',
  ]);
});

test('CP-07: PENDIENTE -> EN_PROCESO es una transición válida', () => {
  assert.equal(esTransicionPermitida('PENDIENTE', 'EN_PROCESO'), true);
  assert.equal(esTransicionPermitida('PENDIENTE', 'CANCELADA'), true);
  assert.equal(esTransicionPermitida('PENDIENTE', 'RESUELTA'), false);
});

test('CP-08: RESUELTA -> PENDIENTE es rechazada (estado final)', () => {
  assert.equal(esTransicionPermitida('RESUELTA', 'PENDIENTE'), false);
  assert.equal(esTransicionPermitida('CANCELADA', 'EN_PROCESO'), false);
  assert.deepEqual(TRANSICIONES_PERMITIDAS.RESUELTA, []);
  assert.deepEqual(TRANSICIONES_PERMITIDAS.CANCELADA, []);
});

test('CP-02: el backend rechaza un solicitante vacío', () => {
  const resultado = crearSolicitudSchema.safeParse({
    ...datosValidos,
    solicitante: '   ',
  });
  assert.equal(resultado.success, false);
});

test('CP-02: el solicitante debe tener al menos 3 caracteres', () => {
  assert.equal(
    crearSolicitudSchema.safeParse({ ...datosValidos, solicitante: 'An' })
      .success,
    false,
  );
});

test('CP-03: la descripción debe tener al menos 10 caracteres', () => {
  assert.equal(
    crearSolicitudSchema.safeParse({ ...datosValidos, descripcion: 'Falla' })
      .success,
    false,
  );
});

test('CP-04: se rechaza una prioridad incorrecta', () => {
  assert.equal(
    crearSolicitudSchema.safeParse({ ...datosValidos, prioridad: 'URGENTE' })
      .success,
    false,
  );
});

test('los datos válidos se normalizan recortando espacios', () => {
  const resultado = crearSolicitudSchema.safeParse(datosValidos);
  assert.equal(resultado.success, true);
  assert.equal(resultado.data.solicitante, 'Juan Pérez');
  assert.equal(resultado.data.descripcion, 'El equipo no enciende desde esta mañana');
});

test('el equipo debe ser un UUID válido', () => {
  assert.equal(
    crearSolicitudSchema.safeParse({ ...datosValidos, equipo_id: 'EQ-001' })
      .success,
    false,
  );
});

test('el cambio de estado solo acepta los cuatro valores permitidos', () => {
  assert.equal(cambiarEstadoSchema.safeParse({ estado: 'EN_PROCESO' }).success, true);
  assert.equal(cambiarEstadoSchema.safeParse({ estado: 'TERMINADA' }).success, false);
});

test('los filtros de lista combinan texto, prioridad y estado', () => {
  const resultado = listarSolicitudesSchema.safeParse({
    q: 'juan',
    prioridad: 'ALTA',
    estado: 'PENDIENTE',
    incluirInactivas: 'true',
  });
  assert.equal(resultado.success, true);
  assert.equal(resultado.data.incluirInactivas, true);
});

test('los filtros ilike escapan caracteres especiales', () => {
  const filtro = filtroIlike('50%_a,b', ['codigo_solicitud']);
  assert.equal(
    filtro,
    'codigo_solicitud.ilike."%50\\\\%\\\\_a,b%"',
  );
  assert.ok(filtro.startsWith('codigo_solicitud.ilike."'));
  assert.ok(filtro.endsWith('%"'));
});

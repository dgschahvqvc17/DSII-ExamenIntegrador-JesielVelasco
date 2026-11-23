const supabase = require('../config/supabase');
const { verificarError } = require('../utils/supabase');
const { filtroIlike } = require('../utils/query');

const VISTA = 'v_solicitudes_detalle';
const CON_EQUIPO = '*, equipos(id, codigo, nombre, ubicacion, estado)';

const listar = async ({
  q,
  prioridad,
  estado,
  incluirInactivas = false,
  limite,
} = {}) => {
  let consulta = supabase.from(VISTA).select('*');

  if (!incluirInactivas) consulta = consulta.eq('activo', true);
  if (prioridad) consulta = consulta.eq('prioridad', prioridad);
  if (estado) consulta = consulta.eq('estado', estado);
  if (q) {
    consulta = consulta.or(
      filtroIlike(q, [
        'codigo_solicitud',
        'solicitante',
        'equipo_nombre',
        'equipo_codigo',
      ]),
    );
  }

  consulta = consulta.order('fecha_registro', { ascending: false });
  if (limite) consulta = consulta.limit(limite);

  const { data, error } = await consulta;
  verificarError(error, 'la consulta de solicitudes');
  return data || [];
};

const buscarPorId = async (id, { incluirInactivas = false } = {}) => {
  let consulta = supabase.from(VISTA).select('*').eq('id', id);
  if (!incluirInactivas) consulta = consulta.eq('activo', true);

  const { data, error } = await consulta.maybeSingle();
  verificarError(error, 'la consulta de la solicitud');
  return data;
};

const generarCodigo = async () => {
  const { data, error } = await supabase.rpc('generar_codigo_solicitud');
  verificarError(error, 'la generación del código de solicitud');
  return data;
};

const crear = async (datos) => {
  const { data, error } = await supabase
    .from('solicitudes')
    .insert(datos)
    .select(CON_EQUIPO)
    .single();

  verificarError(error, 'el registro de la solicitud');
  return data;
};

const actualizar = async (id, cambios) => {
  const { data, error } = await supabase
    .from('solicitudes')
    .update(cambios)
    .eq('id', id)
    .eq('activo', true)
    .select(CON_EQUIPO)
    .maybeSingle();

  verificarError(error, 'la actualización de la solicitud');
  return data;
};

const cambiarEstado = async (id, estado) => {
  const { data, error } = await supabase
    .from('solicitudes')
    .update({ estado })
    .eq('id', id)
    .eq('activo', true)
    .select(CON_EQUIPO)
    .maybeSingle();

  verificarError(error, 'el cambio de estado');
  return data;
};

const desactivar = async (id) => {
  const { data, error } = await supabase
    .from('solicitudes')
    .update({ activo: false })
    .eq('id', id)
    .eq('activo', true)
    .select(CON_EQUIPO)
    .maybeSingle();

  verificarError(error, 'la eliminación lógica');
  return data;
};

const obtenerHistorial = async (id) => {
  const { data, error } = await supabase
    .from('historial_estados')
    .select('*')
    .eq('solicitud_id', id)
    .order('fecha_cambio', { ascending: true });

  verificarError(error, 'la consulta del historial');
  return data || [];
};

module.exports = {
  listar,
  buscarPorId,
  generarCodigo,
  crear,
  actualizar,
  cambiarEstado,
  desactivar,
  obtenerHistorial,
};

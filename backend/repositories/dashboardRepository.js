const supabase = require('../config/supabase');
const { verificarError } = require('../utils/supabase');
const { ESTADOS, PRIORIDADES } = require('../models/solicitud.model');

const contar = async (tabla, filtros = []) => {
  let consulta = supabase.from(tabla).select('*', { count: 'exact', head: true });
  filtros.forEach(([columna, valor]) => {
    consulta = consulta.eq(columna, valor);
  });

  const { count, error } = await consulta;
  verificarError(error, `el conteo de ${tabla}`);
  return count || 0;
};

const agrupar = async (columna) => {
  const { data, error } = await supabase
    .from('solicitudes')
    .select(columna)
    .eq('activo', true);

  verificarError(error, 'las estadísticas');

  const resultado = {};
  (data || []).forEach((fila) => {
    const clave = fila[columna];
    resultado[clave] = (resultado[clave] || 0) + 1;
  });
  return resultado;
};

const obtenerDatos = async () => {
  const [
    totalSolicitudes,
    totalActivas,
    totalEquipos,
    porEstado,
    porPrioridad,
    recientes,
  ] = await Promise.all([
    contar('solicitudes'),
    contar('solicitudes', [['activo', true]]),
    contar('equipos'),
    agrupar('estado'),
    agrupar('prioridad'),
    supabase
      .from('v_solicitudes_detalle')
      .select('*')
      .eq('activo', true)
      .order('fecha_registro', { ascending: false })
      .limit(5),
  ]);

  verificarError(recientes.error, 'la consulta de solicitudes recientes');

  const estados = Object.fromEntries(ESTADOS.map((e) => [e, porEstado[e] || 0]));
  const prioridades = Object.fromEntries(
    PRIORIDADES.map((p) => [p, porPrioridad[p] || 0]),
  );

  return {
    totalSolicitudes,
    totalActivas,
    totalEquipos,
    pendientes: estados.PENDIENTE,
    enProceso: estados.EN_PROCESO,
    resueltas: estados.RESUELTA,
    canceladas: estados.CANCELADA,
    porEstado: estados,
    porPrioridad: prioridades,
    recientes: recientes.data || [],
  };
};

module.exports = { obtenerDatos };

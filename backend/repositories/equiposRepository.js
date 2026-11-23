const supabase = require('../config/supabase');
const { verificarError } = require('../utils/supabase');
const { filtroIlike } = require('../utils/query');

const SELECCION = '*';

const listar = async ({ q } = {}) => {
  let consulta = supabase
    .from('equipos')
    .select(SELECCION)
    .order('codigo', { ascending: true });

  if (q) {
    consulta = consulta.or(filtroIlike(q, ['codigo', 'nombre', 'ubicacion']));
  }

  const { data, error } = await consulta;
  verificarError(error, 'la consulta de equipos');
  return data || [];
};

const buscarPorId = async (id) => {
  const { data, error } = await supabase
    .from('equipos')
    .select(SELECCION)
    .eq('id', id)
    .maybeSingle();

  verificarError(error, 'la consulta del equipo');
  return data;
};

module.exports = { listar, buscarPorId };

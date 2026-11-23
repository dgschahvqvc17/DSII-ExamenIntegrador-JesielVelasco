/**
 * Escapa valores usados en filtros ilike de PostgREST para evitar que el
 * usuario modifique la sintaxis del filtro (inyección de parámetros).
 */
const escaparIlike = (valor) =>
  String(valor).replace(/[\\%_]/g, '\\$&');

const valorEntreComillas = (valor) =>
  `"${String(valor).replace(/[\\"]/g, '\\$&')}"`;

const filtroIlike = (valor, columnas) =>
  columnas
    .map((columna) => `${columna}.ilike.${valorEntreComillas(`%${escaparIlike(valor)}%`)}`)
    .join(',');

module.exports = { escaparIlike, valorEntreComillas, filtroIlike };

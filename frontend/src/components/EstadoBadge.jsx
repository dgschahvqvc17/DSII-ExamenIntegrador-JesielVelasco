import { ETIQUETAS_ESTADO } from '../utils/format';

const CLASES = {
  PENDIENTE: 'lab-badge--pendiente',
  EN_PROCESO: 'lab-badge--en_proceso',
  RESUELTA: 'lab-badge--resuelta',
  CANCELADA: 'lab-badge--cancelada',
};

export default function EstadoBadge({ estado }) {
  return (
    <span className={`lab-badge ${CLASES[estado] || 'lab-badge--inactivo'}`}>
      {ETIQUETAS_ESTADO[estado] || estado}
    </span>
  );
}

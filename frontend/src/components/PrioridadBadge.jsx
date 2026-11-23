import { ETIQUETAS_PRIORIDAD } from '../utils/format';

const CLASES = {
  BAJA: 'lab-badge--baja',
  MEDIA: 'lab-badge--media',
  ALTA: 'lab-badge--alta',
};

export default function PrioridadBadge({ prioridad }) {
  return (
    <span className={`lab-badge ${CLASES[prioridad] || 'lab-badge--baja'}`}>
      {ETIQUETAS_PRIORIDAD[prioridad] || prioridad}
    </span>
  );
}

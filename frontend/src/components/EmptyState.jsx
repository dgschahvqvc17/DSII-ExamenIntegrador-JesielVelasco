import { SearchX } from 'lucide-react';

export default function EmptyState({
  titulo = 'No hay resultados',
  mensaje = 'Prueba con otros filtros o registra una nueva solicitud.',
}) {
  return (
    <div className="lab-state">
      <div className="lab-state__icon">
        <SearchX size={24} />
      </div>
      <div className="fw-semibold text-dark">{titulo}</div>
      <div className="small">{mensaje}</div>
    </div>
  );
}

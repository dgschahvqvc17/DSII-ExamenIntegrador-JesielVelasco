import LoadingState from './LoadingState';
import EstadoBadge from './EstadoBadge';
import PrioridadBadge from './PrioridadBadge';
import { formatearFecha, ETIQUETAS_ESTADO } from '../utils/format';

const Campo = ({ etiqueta, children, full = false }) => (
  <div className={`lab-detail-item ${full ? 'lab-detail-full' : ''}`}>
    <div className="lab-detail-item__label">{etiqueta}</div>
    <div className="lab-detail-item__value">{children}</div>
  </div>
);

export default function SolicitudDetalle({
  solicitud,
  transiciones = [],
  cargandoHistorial = false,
}) {
  if (!solicitud) return null;

  return (
    <>
      <div className="lab-detail-grid">
        <Campo etiqueta="Código de solicitud">
          <span className="lab-table__code">{solicitud.codigo_solicitud}</span>
        </Campo>
        <Campo etiqueta="Solicitante">{solicitud.solicitante}</Campo>

        <Campo etiqueta="Equipo">
          {solicitud.equipo_codigo || solicitud.equipos?.codigo} —{' '}
          {solicitud.equipo_nombre || solicitud.equipos?.nombre}
        </Campo>
        <Campo etiqueta="Ubicación">
          {solicitud.equipo_ubicacion || solicitud.equipos?.ubicacion || '—'}
        </Campo>

        <Campo etiqueta="Prioridad">
          <PrioridadBadge prioridad={solicitud.prioridad} />
        </Campo>
        <Campo etiqueta="Estado actual">
          <EstadoBadge estado={solicitud.estado} />
        </Campo>

        <Campo etiqueta="Fecha de registro">
          {formatearFecha(solicitud.fecha_registro)}
        </Campo>
        <Campo etiqueta="Última actualización">
          {formatearFecha(solicitud.fecha_actualizacion)}
        </Campo>

        <Campo etiqueta="Descripción completa" full>
          <div className="bg-light border rounded p-3">{solicitud.descripcion}</div>
        </Campo>

        <Campo etiqueta="Registro activo" full>
          {solicitud.activo ? (
            <span className="lab-badge lab-badge--activo">Activo</span>
          ) : (
            <span className="lab-badge lab-badge--inactivo">
              Eliminado lógicamente
            </span>
          )}
        </Campo>
      </div>

      <hr className="my-4" />

      <h3 className="h6 fw-bold text-dark mb-3">Historial de estados</h3>
      {cargandoHistorial ? (
        <LoadingState mensaje="Cargando historial…" />
      ) : transiciones.length ? (
        <ul className="lab-timeline">
          {transiciones.map((transicion) => (
            <li key={transicion.id}>
              <div className="fw-semibold small">
                {ETIQUETAS_ESTADO[transicion.estado_anterior] ||
                  transicion.estado_anterior}{' '}
                →{' '}
                {ETIQUETAS_ESTADO[transicion.estado_nuevo] ||
                  transicion.estado_nuevo}
              </div>
              <div className="lab-table__muted">
                {formatearFecha(transicion.fecha_cambio)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted small mb-0">
          Esta solicitud aún no ha cambiado de estado.
        </p>
      )}
    </>
  );
}

import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import EstadoBadge from './EstadoBadge';
import { TRANSICIONES, ETIQUETAS_ESTADO } from '../utils/format';

export default function CambioEstadoModal({
  solicitud,
  onConfirm,
  onCancel,
  guardando = false,
}) {
  const permitidos = TRANSICIONES[solicitud?.estado] || [];
  const [nuevoEstado, setNuevoEstado] = useState(permitidos[0] || '');

  return (
    <div>
      <div className="d-flex align-items-center gap-3 bg-light border rounded p-3 mb-4">
        <div>
          <div className="lab-detail-item__label">Estado actual</div>
          <EstadoBadge estado={solicitud?.estado} />
        </div>
        <div className="ms-auto text-end">
          <div className="lab-detail-item__label">Solicitud</div>
          <strong>{solicitud?.codigo_solicitud}</strong>
        </div>
      </div>

      {permitidos.length === 0 ? (
        <div className="alert alert-secondary d-flex align-items-center gap-2 mb-0">
          <LockKeyhole size={18} />
          <span>
            La solicitud está en un estado final. No se permiten nuevas
            transiciones.
          </span>
        </div>
      ) : (
        <>
          <p className="small text-muted mb-2">
            Selecciona el nuevo estado. El backend validará la transición antes
            de guardar.
          </p>
          <div className="d-grid gap-2">
            {permitidos.map((estado) => (
              <button
                key={estado}
                type="button"
                className={`btn text-start d-flex align-items-center justify-content-between ${
                  nuevoEstado === estado
                    ? 'lab-btn-primary text-white'
                    : 'btn-outline-secondary'
                }`}
                onClick={() => setNuevoEstado(estado)}
                disabled={guardando}
              >
                <span className="fw-semibold">
                  {ETIQUETAS_ESTADO[estado]}
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-light border"
          onClick={onCancel}
          disabled={guardando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn lab-btn-primary text-white"
          disabled={!nuevoEstado || guardando}
          onClick={() => onConfirm(nuevoEstado)}
        >
          Confirmar cambio
        </button>
      </div>
    </div>
  );
}

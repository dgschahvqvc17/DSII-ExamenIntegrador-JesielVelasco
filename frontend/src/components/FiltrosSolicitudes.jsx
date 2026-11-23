import { Plus, RotateCcw, Search } from 'lucide-react';
import { ESTADOS, PRIORIDADES, ETIQUETAS_ESTADO } from '../utils/format';

export default function FiltrosSolicitudes({
  filtros,
  onCambiar,
  onLimpiar,
  onNueva,
}) {
  return (
    <div className="lab-card mb-4">
      <div className="lab-card__body">
        <div className="lab-filters">
          <div>
            <label className="form-label" htmlFor="buscar">
              Buscar
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} />
              </span>
              <input
                id="buscar"
                type="search"
                className="form-control"
                placeholder="Código, solicitante o equipo…"
                value={filtros.q}
                onChange={(e) => onCambiar('q', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="filtro-prioridad">
              Prioridad
            </label>
            <select
              id="filtro-prioridad"
              className="form-select"
              value={filtros.prioridad}
              onChange={(e) => onCambiar('prioridad', e.target.value)}
            >
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="filtro-estado">
              Estado
            </label>
            <select
              id="filtro-estado"
              className="form-select"
              value={filtros.estado}
              onChange={(e) => onCambiar('estado', e.target.value)}
            >
              <option value="">Todos</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {ETIQUETAS_ESTADO[estado]}
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border"
              onClick={onLimpiar}
              title="Limpiar filtros"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className="btn lab-btn-primary text-white text-nowrap"
              onClick={onNueva}
            >
              <Plus size={16} className="me-1" />
              Nueva solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

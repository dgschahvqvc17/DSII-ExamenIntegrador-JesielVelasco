import { useState } from 'react';
import { Eye, History } from 'lucide-react';
import FiltrosSolicitudes from '../components/FiltrosSolicitudes';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SolicitudDetalle from '../components/SolicitudDetalle';
import EstadoBadge from '../components/EstadoBadge';
import PrioridadBadge from '../components/PrioridadBadge';
import { useHistorialSolicitudes } from '../hooks/useSolicitudes';
import * as solicitudesService from '../services/solicitudesService';
import { formatearFecha, mensajeError } from '../utils/format';
import { notificarError } from '../utils/notificaciones';
import { useNavigate } from 'react-router-dom';

const FILTROS_VACIOS = { q: '', prioridad: '', estado: '' };

export default function Historial() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [seleccionada, setSeleccionada] = useState(null);
  const [transiciones, setTransiciones] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const navigate = useNavigate();

  const {
    data: solicitudes,
    loading,
    error,
    recargar,
  } = useHistorialSolicitudes(filtros);

  const verSeguimiento = async (solicitud) => {
    setSeleccionada(solicitud);
    setTransiciones([]);
    setCargandoDetalle(true);
    try {
      const resultado = await solicitudesService.historial(solicitud.id);
      setTransiciones(resultado.transiciones || []);
    } catch (error) {
      notificarError(mensajeError(error));
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <>
      <div className="lab-page-header">
        <div>
          <h1>Historial y seguimiento</h1>
          <p>
            Consulta todas las solicitudes registradas, incluidas las eliminadas
            lógicamente, y su trazabilidad de estados.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-light border"
          onClick={recargar}
          disabled={loading}
        >
          <History size={16} className="me-1" />
          Actualizar
        </button>
      </div>

      {error && <div className="lab-inline-alert">{mensajeError(error)}</div>}

      <FiltrosSolicitudes
        filtros={filtros}
        onCambiar={(campo, valor) =>
          setFiltros((actual) => ({ ...actual, [campo]: valor }))
        }
        onLimpiar={() => setFiltros(FILTROS_VACIOS)}
        onNueva={() => navigate('/solicitudes?nueva=1')}
      />

      <div className="lab-card">
        <div className="lab-card__header">
          <h2 className="lab-card__title">
            Todas las solicitudes
            {solicitudes ? ` (${solicitudes.length})` : ''}
          </h2>
        </div>

        {loading && !solicitudes ? (
          <LoadingState mensaje="Cargando historial…" />
        ) : !solicitudes || solicitudes.length === 0 ? (
          <EmptyState
            titulo="No hay solicitudes en el historial"
            mensaje="Cuando registres solicitudes aparecerán aquí."
          />
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table align-middle">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Solicitante</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Registro activo</th>
                  <th className="text-end">Seguimiento</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="lab-table__code">
                      {solicitud.codigo_solicitud}
                    </td>
                    <td>{solicitud.equipo_nombre}</td>
                    <td>{solicitud.solicitante}</td>
                    <td>
                      <PrioridadBadge prioridad={solicitud.prioridad} />
                    </td>
                    <td>
                      <EstadoBadge estado={solicitud.estado} />
                    </td>
                    <td className="lab-table__muted">
                      {formatearFecha(solicitud.fecha_registro)}
                    </td>
                    <td>
                      <span
                        className={`lab-badge ${
                          solicitud.activo
                            ? 'lab-badge--activo'
                            : 'lab-badge--inactivo'
                        }`}
                      >
                        {solicitud.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => verSeguimiento(solicitud)}
                      >
                        <Eye size={15} className="me-1" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={Boolean(seleccionada)}
        onClose={() => setSeleccionada(null)}
        title="Seguimiento de la solicitud"
        wide
        footer={
          <button
            type="button"
            className="btn btn-light border"
            onClick={() => setSeleccionada(null)}
          >
            Cerrar
          </button>
        }
      >
        <SolicitudDetalle
          solicitud={seleccionada}
          transiciones={transiciones}
          cargandoHistorial={cargandoDetalle}
        />
      </Modal>
    </>
  );
}

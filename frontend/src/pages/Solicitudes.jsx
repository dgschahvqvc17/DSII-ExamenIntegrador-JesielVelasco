import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import FiltrosSolicitudes from '../components/FiltrosSolicitudes';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SolicitudForm from '../components/SolicitudForm';
import SolicitudDetalle from '../components/SolicitudDetalle';
import CambioEstadoModal from '../components/CambioEstadoModal';
import EstadoBadge from '../components/EstadoBadge';
import PrioridadBadge from '../components/PrioridadBadge';
import { useSolicitudes } from '../hooks/useSolicitudes';
import { useEquipos } from '../hooks/useEquipos';
import * as solicitudesService from '../services/solicitudesService';
import {
  formatearFecha,
  mensajeError,
  resumir,
} from '../utils/format';
import {
  confirmarEliminacion,
  notificarError,
  notificarExito,
} from '../utils/notificaciones';

const FILTROS_VACIOS = { q: '', prioridad: '', estado: '' };

const mostrarError = (error, prefijo = 'Error') => {
  const detalle =
    error.detalles?.mensaje ||
    (typeof error.detalles === 'string' ? error.detalles : '');
  notificarError(
    `${prefijo}: ${mensajeError(error)}${detalle ? ` — ${detalle}` : ''}`,
  );
};

export default function Solicitudes() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    data: solicitudes,
    loading,
    error,
    recargar,
  } = useSolicitudes(filtros);
  const { data: equipos, error: errorEquipos } = useEquipos();

  const [modalForm, setModalForm] = useState(null); // 'crear' | 'editar'
  const [seleccionada, setSeleccionada] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);
  const [transiciones, setTransiciones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (searchParams.get('nueva') === '1') {
      setSeleccionada(null);
      setModalForm('crear');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const cambiarFiltro = (campo, valor) =>
    setFiltros((actual) => ({ ...actual, [campo]: valor }));

  const abrirNueva = () => {
    setSeleccionada(null);
    setModalForm('crear');
  };

  const abrirEdicion = (solicitud) => {
    setSeleccionada(solicitud);
    setModalForm('editar');
  };

  const cerrarForm = () => {
    if (!guardando) setModalForm(null);
  };

  const guardarFormulario = async (datos) => {
    setGuardando(true);
    try {
      if (modalForm === 'crear') {
        await solicitudesService.crear(datos);
        notificarExito('Solicitud registrada correctamente');
      } else {
        await solicitudesService.actualizar(seleccionada.id, datos);
        notificarExito('Solicitud actualizada correctamente');
      }
      setModalForm(null);
      await recargar();
    } catch (error) {
      mostrarError(error, 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const verDetalle = async (solicitud) => {
    setSeleccionada(solicitud);
    setModalDetalle(true);
    setTransiciones([]);
    setCargandoHistorial(true);
    try {
      const resultado = await solicitudesService.historial(solicitud.id);
      setTransiciones(resultado.transiciones || []);
    } catch (error) {
      notificarError(mensajeError(error));
    } finally {
      setCargandoHistorial(false);
    }
  };

  const confirmarCambioEstado = async (estado) => {
    setGuardando(true);
    try {
      await solicitudesService.cambiarEstado(seleccionada.id, estado);
      notificarExito('Estado actualizado correctamente');
      setModalEstado(false);
      await recargar();
    } catch (error) {
      mostrarError(error, 'Transición rechazada');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (solicitud) => {
    const resultado = await confirmarEliminacion(solicitud.codigo_solicitud);
    if (!resultado.isConfirmed) return;
    try {
      await solicitudesService.eliminar(solicitud.id);
      notificarExito('Solicitud eliminada lógicamente');
      await recargar();
    } catch (error) {
      mostrarError(error, 'No se pudo eliminar');
    }
  };

  return (
    <>
      <div className="lab-page-header">
        <div>
          <h1>Solicitudes de mantenimiento</h1>
          <p>
            Registra, busca, edita y da seguimiento a las fallas de los equipos.
          </p>
        </div>
      </div>

      {(error || errorEquipos) && (
        <div className="lab-inline-alert">
          {mensajeError(error || errorEquipos)}
        </div>
      )}

      <FiltrosSolicitudes
        filtros={filtros}
        onCambiar={cambiarFiltro}
        onLimpiar={() => setFiltros(FILTROS_VACIOS)}
        onNueva={abrirNueva}
      />

      <div className="lab-card">
        <div className="lab-card__header">
          <h2 className="lab-card__title">
            Listado de solicitudes activas
            {solicitudes ? ` (${solicitudes.length})` : ''}
          </h2>
        </div>

        {loading && !solicitudes ? (
          <LoadingState mensaje="Cargando solicitudes…" />
        ) : !solicitudes || solicitudes.length === 0 ? (
          <EmptyState
            titulo="No se encontraron solicitudes"
            mensaje="Ajusta los filtros o registra una nueva solicitud."
          />
        ) : (
          <div className="lab-table-wrap">
            <table className="lab-table align-middle">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Solicitante</th>
                  <th>Descripción</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td className="lab-table__code">
                      {solicitud.codigo_solicitud}
                    </td>
                    <td>
                      <div className="fw-semibold small">
                        {solicitud.equipo_nombre}
                      </div>
                      <div className="lab-table__muted">
                        {solicitud.equipo_codigo}
                      </div>
                    </td>
                    <td>{solicitud.solicitante}</td>
                    <td className="lab-table__muted">
                      {resumir(solicitud.descripcion)}
                    </td>
                    <td>
                      <PrioridadBadge prioridad={solicitud.prioridad} />
                    </td>
                    <td>
                      <EstadoBadge estado={solicitud.estado} />
                    </td>
                    <td className="lab-table__muted">
                      {formatearFecha(solicitud.fecha_registro)}
                    </td>
                    <td className="text-end">
                      <div className="lab-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="Ver detalle"
                          onClick={() => verDetalle(solicitud)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="Editar"
                          onClick={() => abrirEdicion(solicitud)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-info"
                          title="Cambiar estado"
                          onClick={() => {
                            setSeleccionada(solicitud);
                            setModalEstado(true);
                          }}
                        >
                          <RefreshCw size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="Eliminar lógicamente"
                          onClick={() => eliminar(solicitud)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={Boolean(modalForm)}
        onClose={cerrarForm}
        title={
          modalForm === 'crear'
            ? 'Registrar nueva solicitud'
            : 'Editar solicitud'
        }
        footer={null}
      >
        {modalForm === 'editar' && (
          <div className="alert alert-light border small mb-4">
            <strong>{seleccionada?.codigo_solicitud}</strong>
            <br />
            El código y la fecha de registro no se pueden modificar. El estado
            se cambia mediante una operación independiente.
          </div>
        )}
        <SolicitudForm
          key={modalForm === 'editar' ? seleccionada?.id : 'nueva'}
          equipos={equipos || []}
          inicial={modalForm === 'editar' ? seleccionada : null}
          onSubmit={guardarFormulario}
          onCancel={cerrarForm}
          guardando={guardando}
        />
      </Modal>

      <Modal
        show={modalDetalle}
        onClose={() => setModalDetalle(false)}
        title="Detalle de la solicitud"
        wide
        footer={
          <button
            type="button"
            className="btn btn-light border"
            onClick={() => setModalDetalle(false)}
          >
            Cerrar
          </button>
        }
      >
        <SolicitudDetalle
          solicitud={modalDetalle ? seleccionada : null}
          transiciones={transiciones}
          cargandoHistorial={cargandoHistorial}
        />
      </Modal>

      <Modal
        show={modalEstado}
        onClose={() => !guardando && setModalEstado(false)}
        title="Cambiar estado"
        footer={null}
      >
        <CambioEstadoModal
          key={`${seleccionada?.id}-${seleccionada?.estado}`}
          solicitud={modalEstado ? seleccionada : null}
          onConfirm={confirmarCambioEstado}
          onCancel={() => setModalEstado(false)}
          guardando={guardando}
        />
      </Modal>
    </>
  );
}

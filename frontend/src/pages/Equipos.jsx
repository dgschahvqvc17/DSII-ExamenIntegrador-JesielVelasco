import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, MapPin, Plus, Search, Server } from 'lucide-react';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { useEquipos } from '../hooks/useEquipos';
import { obtener } from '../services/equiposService';
import { formatearFecha, mensajeError } from '../utils/format';
import { notificarError } from '../utils/notificaciones';

export default function Equipos() {
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const navigate = useNavigate();

  const { data: equipos, loading, error } = useEquipos(busqueda);

  const verDetalle = async (id) => {
    setCargandoDetalle(true);
    try {
      setDetalle(await obtener(id));
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
          <h1>Equipos de laboratorio</h1>
          <p>
            Catálogo oficial almacenado en Supabase. No se crean equipos
            adicionales desde esta interfaz.
          </p>
        </div>
        <button
          type="button"
          className="btn lab-btn-primary text-white"
          onClick={() => navigate('/solicitudes?nueva=1')}
        >
          <Plus size={16} className="me-1" />
          Registrar solicitud
        </button>
      </div>

      <div className="lab-card mb-4">
        <div className="lab-card__body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6 col-lg-5">
              <label className="form-label" htmlFor="buscar-equipo">
                Buscar por código, nombre o ubicación
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={16} />
                </span>
                <input
                  id="buscar-equipo"
                  type="search"
                  className="form-control"
                  placeholder="Ej. EQ-001, proyector…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <label className="form-label" htmlFor="total-equipos">
                Equipos encontrados
              </label>
              <input
                id="total-equipos"
                className="form-control"
                value={equipos ? equipos.length : '—'}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="lab-inline-alert">{mensajeError(error)}</div>}

      {loading && !equipos ? (
        <LoadingState mensaje="Cargando catálogo de equipos…" />
      ) : !equipos || equipos.length === 0 ? (
        <EmptyState
          titulo="No se encontraron equipos"
          mensaje="Prueba con otro código o nombre."
        />
      ) : (
        <div className="row g-3">
          {equipos.map((equipo) => (
            <div className="col-md-6 col-xl-3" key={equipo.id}>
              <div className="lab-card h-100 d-flex flex-column">
                <div className="lab-card__body d-flex flex-column h-100">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div
                      className="lab-stat__icon"
                      style={{ background: '#e7f0fb', color: '#123a6b' }}
                    >
                      <Cpu size={22} />
                    </div>
                    <span className="lab-badge lab-badge--activo">
                      {equipo.estado}
                    </span>
                  </div>
                  <div className="lab-table__code mb-1">{equipo.codigo}</div>
                  <h2 className="h6 fw-bold mb-2">{equipo.nombre}</h2>
                  <div className="lab-table__muted small d-flex align-items-center gap-1 mb-4">
                    <MapPin size={14} />
                    {equipo.ubicacion}
                  </div>
                  <div className="mt-auto d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border flex-fill"
                      onClick={() => verDetalle(equipo.id)}
                    >
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm lab-btn-primary text-white flex-fill"
                      onClick={() => navigate('/solicitudes?nueva=1')}
                    >
                      Solicitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={Boolean(detalle) || cargandoDetalle}
        onClose={() => setDetalle(null)}
        title="Detalle del equipo"
        footer={
          <button
            type="button"
            className="btn btn-light border"
            onClick={() => setDetalle(null)}
          >
            Cerrar
          </button>
        }
      >
        {cargandoDetalle ? (
          <LoadingState mensaje="Cargando detalle…" />
        ) : detalle ? (
          <div className="lab-detail-grid">
            <div>
              <div className="lab-detail-item__label">Código</div>
              <div className="lab-detail-item__value">{detalle.codigo}</div>
            </div>
            <div>
              <div className="lab-detail-item__label">Estado</div>
              <div className="lab-detail-item__value">{detalle.estado}</div>
            </div>
            <div>
              <div className="lab-detail-item__label">Nombre</div>
              <div className="lab-detail-item__value">{detalle.nombre}</div>
            </div>
            <div>
              <div className="lab-detail-item__label">Ubicación</div>
              <div className="lab-detail-item__value">{detalle.ubicacion}</div>
            </div>
            <div className="lab-detail-full">
              <div className="lab-detail-item__label">Registrado desde</div>
              <div className="lab-detail-item__value">
                <Server size={14} className="me-1" />
                {formatearFecha(detalle.created_at)}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

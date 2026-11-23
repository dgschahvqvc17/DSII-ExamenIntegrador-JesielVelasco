import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Cpu,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DistribucionChart from '../components/DistribucionChart';
import EstadoBadge from '../components/EstadoBadge';
import PrioridadBadge from '../components/PrioridadBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { obtenerEstadisticas } from '../services/dashboardService';
import { formatearFecha, mensajeError } from '../utils/format';

const COLORES_PRIORIDAD = {
  Baja: '#64748b',
  Media: '#d97706',
  Alta: '#dc3545',
};

const COLORES_ESTADO = {
  Pendiente: '#d97706',
  'En proceso': '#0d6efd',
  Resuelta: '#198754',
  Cancelada: '#dc3545',
};

export default function Dashboard() {
  const cargar = useCallback(() => obtenerEstadisticas(), []);
  const { data: stats, loading, error, recargar } = useAsync(cargar, [cargar]);

  return (
    <>
      <div className="lab-page-header">
        <div>
          <h1>Panel principal</h1>
          <p>
            Resumen general de solicitudes y equipos, obtenido directamente de
            Supabase.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-light border"
          onClick={recargar}
          disabled={loading}
        >
          <RefreshCw size={16} className={`me-1 ${loading ? 'spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="lab-inline-alert">
          No se pudieron cargar las estadísticas: {mensajeError(error)}
        </div>
      )}

      {loading && !stats ? (
        <LoadingState mensaje="Calculando indicadores…" />
      ) : stats ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="Total solicitudes"
                value={stats.totalSolicitudes}
                icon={ClipboardList}
                variante="primary"
              />
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="Pendientes"
                value={stats.pendientes}
                icon={Clock3}
                variante="warning"
              />
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="En proceso"
                value={stats.enProceso}
                icon={LoaderCircle}
                variante="info"
              />
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="Resueltas"
                value={stats.resueltas}
                icon={CheckCircle2}
                variante="success"
              />
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="Canceladas"
                value={stats.canceladas}
                icon={XCircle}
                variante="danger"
              />
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <StatCard
                label="Equipos"
                value={stats.totalEquipos}
                icon={Cpu}
                variante="secondary"
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <DistribucionChart
                titulo="Distribución por prioridad"
                datos={{
                  Baja: stats.porPrioridad.BAJA || 0,
                  Media: stats.porPrioridad.MEDIA || 0,
                  Alta: stats.porPrioridad.ALTA || 0,
                }}
                colores={COLORES_PRIORIDAD}
              />
            </div>
            <div className="col-lg-6">
              <DistribucionChart
                titulo="Distribución por estado"
                datos={{
                  Pendiente: stats.porEstado.PENDIENTE || 0,
                  'En proceso': stats.porEstado.EN_PROCESO || 0,
                  Resuelta: stats.porEstado.RESUELTA || 0,
                  Cancelada: stats.porEstado.CANCELADA || 0,
                }}
                colores={COLORES_ESTADO}
              />
            </div>
          </div>

          <div className="lab-card">
            <div className="lab-card__header">
              <h2 className="lab-card__title">Solicitudes recientes</h2>
              <Link
                to="/solicitudes"
                className="small text-decoration-none d-inline-flex align-items-center gap-1"
              >
                Ver todas <ArrowUpRight size={14} />
              </Link>
            </div>
            {stats.recientes.length === 0 ? (
              <EmptyState
                titulo="Aún no hay solicitudes"
                mensaje="Registra la primera solicitud desde el módulo Solicitudes."
              />
            ) : (
              <div className="lab-table-wrap">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Equipo</th>
                      <th>Solicitante</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recientes.map((solicitud) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

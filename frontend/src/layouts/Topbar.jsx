import { useLocation } from 'react-router-dom';
import { Menu, ShieldCheck } from 'lucide-react';

const TITULOS = {
  '/': ['Panel principal', 'Indicadores en tiempo real de LabCare'],
  '/solicitudes': ['Solicitudes', 'Gestión de mantenimiento de equipos'],
  '/equipos': ['Equipos', 'Catálogo de laboratorio almacenado en Supabase'],
  '/historial': ['Historial y seguimiento', 'Trazabilidad de estados de solicitudes'],
  '/documentacion': ['Documentación', 'Guía técnica del sistema'],
};

export default function Topbar({ onAbrirMenu }) {
  const { pathname } = useLocation();
  const [titulo, subtitulo] = TITULOS[pathname] || [
    'LabCare',
    'Sistema de gestión de mantenimiento',
  ];

  const hoy = new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="lab-topbar">
      <div className="d-flex align-items-center gap-3 min-w-0">
        <button
          type="button"
          className="lab-menu-button"
          aria-label="Abrir menú"
          onClick={onAbrirMenu}
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h2 className="lab-topbar__title text-truncate">{titulo}</h2>
          <p className="lab-topbar__subtitle text-truncate">{subtitulo}</p>
        </div>
      </div>
      <div className="lab-topbar__right">
        <span className="lab-date text-capitalize">{hoy}</span>
        <span className="lab-badge lab-badge--activo">
          <ShieldCheck size={13} className="me-1" />
          Sistema activo
        </span>
      </div>
    </header>
  );
}

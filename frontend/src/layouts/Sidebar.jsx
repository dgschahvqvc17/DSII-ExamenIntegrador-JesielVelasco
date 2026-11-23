import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Cpu,
  FlaskConical,
  History,
  LayoutDashboard,
} from 'lucide-react';

const ENLACES = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, fin: true },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList },
  { to: '/equipos', label: 'Equipos', icon: Cpu },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/documentacion', label: 'Documentación', icon: BookOpen },
];

export default function Sidebar({ abierto, onCerrar }) {
  return (
    <>
      <div
        className={`lab-sidebar__backdrop ${abierto ? 'is-visible' : ''}`}
        onClick={onCerrar}
        aria-hidden="true"
      />
      <aside className={`lab-sidebar ${abierto ? 'is-open' : ''}`}>
        <div className="lab-sidebar__brand">
          <div className="lab-sidebar__logo">
            <FlaskConical size={22} />
          </div>
          <div>
            <div className="lab-sidebar__title">LabCare</div>
            <div className="lab-sidebar__subtitle">UPDS · Sistemas II</div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white ms-auto d-lg-none"
            aria-label="Cerrar menú"
            onClick={onCerrar}
          />
        </div>

        <nav className="lab-sidebar__nav">
          <div className="lab-sidebar__section">Menú principal</div>
          {ENLACES.map(({ to, label, icon: Icon, fin }) => (
            <NavLink
              key={to}
              to={to}
              end={fin}
              className={({ isActive }) => `lab-nav-link ${isActive ? 'active' : ''}`}
              onClick={onCerrar}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="lab-sidebar__section mt-4">Sistema</div>
          <div className="px-3 py-1 small text-white-50">
            Versión 1.0 · Supabase
          </div>
        </nav>

        <div className="lab-sidebar__footer">
          Universidad Privada Domingo Savio
          <br />
          Desarrollo de Sistemas II
        </div>
      </aside>
    </>
  );
}

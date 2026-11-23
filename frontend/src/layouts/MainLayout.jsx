import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />
      <div className="lab-main">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="lab-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

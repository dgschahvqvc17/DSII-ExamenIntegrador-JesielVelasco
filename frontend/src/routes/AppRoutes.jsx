import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Solicitudes from '../pages/Solicitudes';
import Equipos from '../pages/Equipos';
import Historial from '../pages/Historial';
import Documentacion from '../pages/Documentacion';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="historial" element={<Historial />} />
        <Route path="documentacion" element={<Documentacion />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

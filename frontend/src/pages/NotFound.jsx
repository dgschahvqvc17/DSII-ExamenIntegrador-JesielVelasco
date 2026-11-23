import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="lab-state" style={{ minHeight: '60vh' }}>
      <div className="lab-state__icon">
        <Compass size={26} />
      </div>
      <h1 className="h4 fw-bold text-dark mb-1">Página no encontrada</h1>
      <p className="small mb-3">
        La ruta que intentas visitar no existe en LabCare.
      </p>
      <Link to="/" className="btn lab-btn-primary text-white">
        Volver al dashboard
      </Link>
    </div>
  );
}

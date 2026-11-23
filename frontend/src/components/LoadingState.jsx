import { LoaderCircle } from 'lucide-react';

export default function LoadingState({ mensaje = 'Cargando información…' }) {
  return (
    <div className="lab-state" role="status" aria-live="polite">
      <div className="lab-state__icon">
        <LoaderCircle size={24} className="spin" />
      </div>
      <div className="fw-semibold">{mensaje}</div>
    </div>
  );
}

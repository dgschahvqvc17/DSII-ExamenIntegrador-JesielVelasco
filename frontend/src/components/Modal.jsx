import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  show,
  onClose,
  title,
  children,
  footer,
  wide = false,
}) {
  useEffect(() => {
    if (!show) return undefined;
    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [show, onClose]);

  if (!show) return null;

  return createPortal(
    <div
      className="lab-modal-backdrop"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose?.();
      }}
    >
      <div
        className={`lab-modal ${wide ? 'lab-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="lab-modal__header">
          <h2 className="lab-modal__title">{title}</h2>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={onClose}
          />
        </div>
        <div className="lab-modal__body">{children}</div>
        {footer && <div className="lab-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

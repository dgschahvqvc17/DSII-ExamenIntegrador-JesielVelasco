import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { PRIORIDADES } from '../utils/format';

const VACIO = {
  equipo_id: '',
  solicitante: '',
  descripcion: '',
  prioridad: 'MEDIA',
};

export default function SolicitudForm({
  equipos = [],
  inicial = null,
  onSubmit,
  onCancel,
  guardando = false,
}) {
  const [formulario, setFormulario] = useState(() =>
    inicial
      ? {
          equipo_id: inicial.equipo_id || '',
          solicitante: inicial.solicitante || '',
          descripcion: inicial.descripcion || '',
          prioridad: inicial.prioridad || 'MEDIA',
        }
      : VACIO,
  );
  const [errores, setErrores] = useState({});

  const cambiar = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: null }));
  };

  const validar = () => {
    const nuevos = {};
    if (!formulario.equipo_id) nuevos.equipo_id = 'Seleccione un equipo';
    if (formulario.solicitante.trim().length < 3)
      nuevos.solicitante = 'Ingrese al menos 3 caracteres';
    if (formulario.descripcion.trim().length < 10)
      nuevos.descripcion = 'Describa la falla con al menos 10 caracteres';
    if (!PRIORIDADES.includes(formulario.prioridad))
      nuevos.prioridad = 'Prioridad inválida';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = (evento) => {
    evento.preventDefault();
    if (!validar()) return;
    onSubmit({
      equipo_id: formulario.equipo_id,
      solicitante: formulario.solicitante.trim(),
      descripcion: formulario.descripcion.trim(),
      prioridad: formulario.prioridad,
    });
  };

  return (
    <form onSubmit={enviar} noValidate>
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="equipo_id">
            Equipo <span className="text-danger">*</span>
          </label>
          <select
            id="equipo_id"
            className={`form-select ${errores.equipo_id ? 'is-invalid' : ''}`}
            value={formulario.equipo_id}
            onChange={(e) => cambiar('equipo_id', e.target.value)}
            disabled={guardando}
          >
            <option value="">Seleccione un equipo…</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.codigo} — {equipo.nombre} ({equipo.ubicacion})
              </option>
            ))}
          </select>
          <div className="invalid-feedback">{errores.equipo_id}</div>
        </div>

        <div className="col-md-7">
          <label className="form-label fw-semibold" htmlFor="solicitante">
            Solicitante <span className="text-danger">*</span>
          </label>
          <input
            id="solicitante"
            type="text"
            className={`form-control ${errores.solicitante ? 'is-invalid' : ''}`}
            placeholder="Nombre de quien reporta la falla"
            value={formulario.solicitante}
            onChange={(e) => cambiar('solicitante', e.target.value)}
            maxLength={120}
            disabled={guardando}
          />
          <div className="invalid-feedback">{errores.solicitante}</div>
        </div>

        <div className="col-md-5">
          <label className="form-label fw-semibold" htmlFor="prioridad">
            Prioridad <span className="text-danger">*</span>
          </label>
          <select
            id="prioridad"
            className={`form-select ${errores.prioridad ? 'is-invalid' : ''}`}
            value={formulario.prioridad}
            onChange={(e) => cambiar('prioridad', e.target.value)}
            disabled={guardando}
          >
            {PRIORIDADES.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {prioridad}
              </option>
            ))}
          </select>
          <div className="invalid-feedback">{errores.prioridad}</div>
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="descripcion">
            Descripción de la falla <span className="text-danger">*</span>
          </label>
          <textarea
            id="descripcion"
            rows={4}
            className={`form-control ${errores.descripcion ? 'is-invalid' : ''}`}
            placeholder="Describa qué sucede, desde cuándo y cualquier detalle relevante…"
            value={formulario.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            maxLength={2000}
            disabled={guardando}
          />
          <div className="invalid-feedback">{errores.descripcion}</div>
          <div className="form-text text-end">
            {formulario.descripcion.trim().length} / 10 caracteres mínimos
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-light border"
          onClick={onCancel}
          disabled={guardando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn lab-btn-primary text-white"
          disabled={guardando}
        >
          {guardando ? (
            <>
              <LoaderCircle size={16} className="spin me-2" />
              Guardando…
            </>
          ) : inicial ? (
            'Guardar cambios'
          ) : (
            'Registrar solicitud'
          )}
        </button>
      </div>
    </form>
  );
}

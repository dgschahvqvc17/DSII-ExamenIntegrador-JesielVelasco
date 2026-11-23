const ENDPOINTS = [
  ['GET', '/api/solicitudes', 'Lista solicitudes activas con búsqueda y filtros'],
  ['POST', '/api/solicitudes', 'Registra una solicitud (estado PENDIENTE)'],
  ['GET', '/api/solicitudes/:id', 'Devuelve el detalle de una solicitud'],
  ['PUT', '/api/solicitudes/:id', 'Edita equipo, solicitante, descripción y prioridad'],
  ['PATCH', '/api/solicitudes/:id/estado', 'Cambia el estado validando la transición'],
  ['DELETE', '/api/solicitudes/:id', 'Realiza la eliminación lógica'],
  ['GET', '/api/solicitudes/historial', 'Lista todas las solicitudes, incluidas inactivas'],
  ['GET', '/api/solicitudes/:id/historial', 'Devuelve el historial de transiciones'],
  ['GET', '/api/equipos', 'Lista el catálogo de equipos'],
  ['GET', '/api/dashboard/estadisticas', 'Indicadores reales desde Supabase'],
];

export default function Documentacion() {
  return (
    <>
      <div className="lab-page-header">
        <div>
          <h1>Documentación técnica</h1>
          <p>
            Referencia rápida de reglas de negocio, API REST y configuración.
          </p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="lab-card h-100">
            <div className="lab-card__header">
              <h2 className="lab-card__title">Reglas de negocio</h2>
            </div>
            <div className="lab-card__body">
              <ul className="mb-0 small">
                <li>El solicitante debe tener al menos 3 caracteres.</li>
                <li>La descripción debe tener al menos 10 caracteres.</li>
                <li>La prioridad solo puede ser BAJA, MEDIA o ALTA.</li>
                <li>Una solicitud nueva siempre nace en PENDIENTE.</li>
                <li>
                  PENDIENTE → EN_PROCESO o CANCELADA; EN_PROCESO → RESUELTA o
                  CANCELADA.
                </li>
                <li>
                  RESUELTA y CANCELADA son estados finales: no permiten
                  regresos.
                </li>
                <li>
                  La eliminación es lógica: activo pasa a FALSE y el registro
                  permanece en Supabase.
                </li>
                <li>
                  El código SOL-AAAAMMDD-XXX se genera con un bloqueo de fila
                  en PostgreSQL, sin duplicados concurrentes.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="lab-card h-100">
            <div className="lab-card__header">
              <h2 className="lab-card__title">Arquitectura y persistencia</h2>
            </div>
            <div className="lab-card__body small">
              <p>
                El navegador <strong>nunca</strong> se conecta a Supabase. Solo
                consume la API REST de Express, que usa la SERVICE_ROLE_KEY
                desde variables de entorno.
              </p>
              <p className="mb-0">
                Backend: config / models / repositories / services / controllers
                / routes / middlewares / validators / utils. Frontend: layouts /
                pages / components / hooks / services / routes / styles.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="lab-card">
            <div className="lab-card__header">
              <h2 className="lab-card__title">Endpoints disponibles</h2>
            </div>
            <div className="lab-table-wrap">
              <table className="lab-table mb-0">
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Ruta</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map(([metodo, ruta, descripcion]) => (
                    <tr key={`${metodo}-${ruta}`}>
                      <td>
                        <span className="lab-badge lab-badge--en_proceso">
                          {metodo}
                        </span>
                      </td>
                      <td className="lab-table__code">{ruta}</td>
                      <td>{descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

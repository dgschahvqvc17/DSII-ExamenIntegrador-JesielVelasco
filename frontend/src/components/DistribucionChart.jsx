export default function DistribucionChart({ titulo, datos, colores }) {
  const total = Object.values(datos || {}).reduce((suma, valor) => suma + valor, 0);

  return (
    <div className="lab-card h-100">
      <div className="lab-card__header">
        <h2 className="lab-card__title">{titulo}</h2>
        <span className="text-muted small">Total: {total}</span>
      </div>
      <div className="lab-card__body">
        {Object.entries(datos || {}).map(([clave, valor]) => (
          <div className="lab-chart-row" key={clave}>
            <span className="lab-chart-row__label">{clave}</span>
            <div className="lab-chart-row__track">
              <div
                className="lab-chart-row__fill"
                style={{
                  width: total ? `${Math.round((valor / total) * 100)}%` : '0%',
                  background: colores?.[clave] || '#1f6fb2',
                }}
                role="progressbar"
                aria-label={`${clave}: ${valor}`}
                aria-valuenow={valor}
                aria-valuemin={0}
                aria-valuemax={total || 1}
              />
            </div>
            <span className="lab-chart-row__value">{valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatCard({ label, value, icon: Icon, variante = 'primary' }) {
  return (
    <div className={`lab-card lab-stat lab-stat--${variante}`}>
      <div>
        <div className="lab-stat__label">{label}</div>
        <div className="lab-stat__value">{value ?? 0}</div>
      </div>
      <div className="lab-stat__icon">
        <Icon size={22} strokeWidth={2} />
      </div>
    </div>
  );
}

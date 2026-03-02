export function StatCard({ label, value, sub, wide = false }) {
  return (
    <section className={`card ${wide ? 'wide' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </section>
  );
}
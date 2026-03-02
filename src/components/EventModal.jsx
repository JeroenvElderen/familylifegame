export function EventModal({ event, onChoose }) {
  if (!event) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modalTitle">{event.title}</div>
        <div className="modalBody">{event.description}</div>
        <div className="choices">
          {event.options.map((opt, idx) => (
            <button key={idx} className="btn choice" onClick={() => onChoose(idx)}>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
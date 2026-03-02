function StatusRow({ label, value }) {
  const tone = value < 30 ? 'bad' : value < 50 ? 'warn' : 'good';
  return (
    <div className="statusRow">
      <div className="statusHeader">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="statusTrack">
        <div className={`statusFill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function EventModal({ event, onChoose, result, onCloseResult }) {
  if (!event && !result) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      {event ? (
        <div className="modal">
          <div className="modalTarget">For: {event.targetPersonName}</div>
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
      ) : null}

      {result ? (
        <div className="modal resultModal">
          <div className="modalTitle">Outcome for {result.personName}</div>
          <div className="modalBody">You chose: {result.option}</div>
          <div className="effectList">
            {result.summary.map((item) => (
              <div key={item} className="effectItem">{item}</div>
            ))}
          </div>
          <StatusRow label="Happiness" value={result.stats.happiness} />
          <StatusRow label="Love" value={result.stats.love} />
          <StatusRow label="Charm" value={result.stats.charm} />
          <StatusRow label="IQ" value={result.stats.iq} />
          <button className="btn" onClick={onCloseResult}>Continue</button>
        </div>
      ) : null}
    </div>
  );
}
function Avatar({ person, onSelect, onActivate, isActive, popup }) {
  if (!person) return null;
  const net = person.job.salaryPerSecond - person.childCostPerSecond;
  return (
    <div className={`avatarNode ${isActive ? 'active' : ''}`}>
      <button
        className="avatarBubble clickable"
        onClick={() => {
          onSelect(person.id);
          onActivate(person.id);
        }}
      >
        {person.avatar}
      </button>
      {popup ? <div className={`cashPopup ${popup.type}`}>{popup.text}</div> : null}
      <div className="avatarLabel">{person.name}</div>
      <div className="avatarMeta">Age {Math.floor(person.ageDays / 365)}</div>
      <div className={`avatarIncome ${net >= 0 ? 'gain' : 'cost'}`}>{net >= 0 ? '+' : ''}{net}/s</div>
      <button className="btn tiny" onClick={() => onActivate(person.id)}>
        Open family line
      </button>
    </div>
  );
}

export function FamilyTree({ family, activePerson, selectedPerson, onSelectPerson, onActivatePerson, cashPopups }) {
  const children = activePerson.childrenIds.map((id) => family.people[id]).filter(Boolean);
  const parent = activePerson.parentId ? family.people[activePerson.parentId] : null;

  return (
    <section className="card wide">
      <div className="label">Family Tree</div>
      <div className="treeWrap">
        {parent ? (
          <div className="treeRow top">
            <Avatar person={parent} onSelect={onSelectPerson} onActivate={onActivatePerson} popup={cashPopups[parent.id]} />
          </div>
        ) : null}

        <div className="treeRow mid">
          <div className="coupleGroup">
            <Avatar person={activePerson} onSelect={onSelectPerson} onActivate={onActivatePerson} isActive popup={cashPopups[activePerson.id]} />
            {activePerson.partnerName ? (
              <div className="partnerNode">
                <div className="avatarBubble partner">{activePerson.partnerAvatar ?? '🙂'}</div>
                <div className="avatarLabel">{activePerson.partnerName}</div>
              </div>
            ) : null}
            {activePerson.partnerName ? <div className="partnerLink" /> : null}
          </div>
        </div>

        {activePerson.partnerName ? <div className="treeConnector" /> : null}

        <div className="treeRow bottom withBranch">
          {children.length ? (
            <>
              <div className="childrenBranch" />
              {children.map((child) => (
                <Avatar key={child.id} person={child} onSelect={onSelectPerson} onActivate={onActivatePerson} popup={cashPopups[child.id]} />
              ))}
            </>
          ) : (
            <div className="emptyChild">No children yet</div>
          )}
        </div>
      </div>
      
      {selectedPerson ? (
        <div className="memberCard">
          <div className="memberTitle">
            {selectedPerson.avatar} {selectedPerson.name}
          </div>
          <div className="memberGrid">
            <span>Happiness: {selectedPerson.stats.happiness}</span>
            <span>Love: {selectedPerson.stats.love}</span>
            <span>Charm: {selectedPerson.stats.charm}</span>
            <span>IQ: {selectedPerson.stats.iq}</span>
            <span>Job: {selectedPerson.job.title}</span>
            <span>Salary/s: {selectedPerson.job.salaryPerSecond}</span>
          </div>
          <div className="sub">Traits: {selectedPerson.traits.join(', ')}</div>
        </div>
      ) : (
        <div className="memberCardHint">Select a person to see their status.</div>
      )}
    </section>
  );
}
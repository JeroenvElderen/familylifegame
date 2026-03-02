function Avatar({ person, onSelect, onActivate, isActive }) {
  if (!person) return null;
  return (
    <div className={`avatarNode ${isActive ? 'active' : ''}`}>
      <button className="avatarBubble clickable" onClick={() => onSelect(person.id)}>
        {person.avatar}
      </button>
      <div className="avatarLabel">{person.name}</div>
      <div className="avatarMeta">Age {Math.floor(person.ageDays / 365)}</div>
      <button className="btn tiny" onClick={() => onActivate(person.id)}>
        Play this family line
      </button>
    </div>
  );
}

export function FamilyTree({ family, activePerson, selectedPerson, onSelectPerson, onActivatePerson }) {
  const children = activePerson.childrenIds.map((id) => family.people[id]).filter(Boolean);
  const parent = activePerson.parentId ? family.people[activePerson.parentId] : null;

  return (
    <section className="card wide">
      <div className="label">Family Tree</div>
      <div className="treeWrap">
        {parent ? (
          <div className="treeRow top">
            <Avatar person={parent} onSelect={onSelectPerson} onActivate={onActivatePerson} />
          </div>
        ) : null}

        <div className="treeRow mid">
          <Avatar person={activePerson} onSelect={onSelectPerson} onActivate={onActivatePerson} isActive />
          {activePerson.partnerName ? <div className="heart">❤️ {activePerson.partnerName}</div> : null}
        </div>

        <div className="treeConnector" />

        <div className="treeRow bottom">
          {children.length ? (
            children.map((child) => (
              <Avatar key={child.id} person={child} onSelect={onSelectPerson} onActivate={onActivatePerson} />
            ))
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
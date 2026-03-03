function Avatar({ person, onSelect, onActivate, isActive }) {
  if (!person) return null;
  const net = (person.job?.salaryPerSecond ?? 0) + (person.pensionPerSecond ?? 0);
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
      <div className="avatarLabel">{person.name}</div>
      <div className="avatarMeta">Age {Math.floor(person.ageDays / 365)}</div>
      <div className={`avatarIncome ${net >= 0 ? 'gain' : 'cost'}`}>{net >= 0 ? '+' : ''}{net}/s</div>
    </div>
  );
}

export function FamilyTree({ family, activePerson, selectedPerson, onSelectPerson, onActivatePerson }) {
  const children = activePerson.childrenIds.map((id) => family.people[id]).filter(Boolean);
  const parent = activePerson.parentId ? family.people[activePerson.parentId] : null;
  const spouse = activePerson.spouseId ? family.people[activePerson.spouseId] : null;

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
          <div className="coupleGroup">
            <Avatar person={activePerson} onSelect={onSelectPerson} onActivate={onActivatePerson} isActive />
            {spouse ? <Avatar person={spouse} onSelect={onSelectPerson} onActivate={onActivatePerson} /> : null}
            {spouse ? <div className="partnerLink" /> : null}
          </div>
        </div>

        {spouse ? <div className="treeConnector" /> : null}

        <div className="treeRow bottom withBranch">
          {children.length ? (
            <>
              <div className="childrenBranch" />
              {children.map((child, index) => (
                <div key={child.id} className="childSlot">
                  <div className="childDrop" style={{ opacity: children.length > 1 ? 1 : 0 }} />
                  <Avatar person={child} onSelect={onSelectPerson} onActivate={onActivatePerson} />
                  {index < children.length - 1 ? <div className="childSpacer" /> : null}
                </div>
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
            <span>Pension/s: {selectedPerson.pensionPerSecond ?? 0}</span>
          </div>
          <div className="sub">Traits: {selectedPerson.traits.join(', ')}</div>
        </div>
      ) : (
        <div className="memberCardHint">Select a person to see their status.</div>
      )}
    </section>
  );
}
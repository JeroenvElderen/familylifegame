function Avatar({ person, onSelect, isActive, isSelected }) {
  if (!person) return null;
  const net = (person.job?.salaryPerSecond ?? 0) + (person.pensionPerSecond ?? 0);
  return (
    <div className={`avatarNode ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}>
      <button className="avatarBubble clickable" onClick={() => onSelect(person.id)}>
        {person.avatar}
      </button>
      <div className="avatarLabel">{person.name}</div>
      <div className="avatarMeta">Age {Math.floor(person.ageDays / 365)}</div>
      <div className={`avatarIncome ${net >= 0 ? 'gain' : 'cost'}`}>{net >= 0 ? '+' : ''}{net}/s</div>
    </div>
  );
}

function FamilyBranch({ person, family, activePersonId, selectedPersonId, onSelectPerson, level = 0 }) {
  if (!person) return null;
  const spouse = person.spouseId ? family.people[person.spouseId] : null;
  const children = person.childrenIds.map((id) => family.people[id]).filter(Boolean);

  return (
    <div className={`branch level-${level}`}>
      <div className="treeRow mid">
        <div className="coupleGroup">
          <Avatar person={person} onSelect={onSelectPerson} isActive={person.id === activePersonId} isSelected={person.id === selectedPersonId} />
          {spouse ? <Avatar person={spouse} onSelect={onSelectPerson} isActive={spouse.id === activePersonId} isSelected={spouse.id === selectedPersonId} /> : null}
          {spouse ? <div className="partnerLink" /> : null}
        </div>
      </div>

      {children.length ? (
        <>
          <div className="treeConnector" />
          <div className="treeRow bottom withBranch">
            <div className="childrenBranch" />
            {children.map((child) => (
              <div key={child.id} className="childSlot">
                <div className="childDrop" style={{ opacity: 1 }} />
                <FamilyBranch
                  person={child}
                  family={family}
                  activePersonId={activePersonId}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={onSelectPerson}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function FamilyTree({ family, activePerson, selectedPerson, onSelectPerson }) {
  const findRoot = () => {
    let node = activePerson;
    const seen = new Set();
    while (node?.parentId && !seen.has(node.id)) {
      seen.add(node.id);
      node = family.people[node.parentId] ?? node;
    }
    return node;
  };

  const rootPerson = findRoot();

  return (
    <section className="card wide">
      <div className="label">Family Tree</div>
      <div className="sub">Click a family member to inspect them. Tree layout stays fixed and only expands with new generations.</div>
      <div className="treeWrap">
        {rootPerson ? (
          <FamilyBranch
            person={rootPerson}
            family={family}
            activePersonId={activePerson.id}
            selectedPersonId={selectedPerson?.id}
            onSelectPerson={onSelectPerson}
          />
        ) : null}
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
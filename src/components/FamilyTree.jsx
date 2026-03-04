import { useMemo, useState } from 'react';

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value ?? 0)));

function StatusBar({ label, value }) {
  const safeValue = clampPercent(value);
  return (
    <div className="memberStatusRow">
      <div className="memberStatusLabel">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="memberStatusTrack">
        <div className="memberStatusFill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

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
      <div className={`avatarIncome ${net >= 0 ? 'gain' : 'cost'}`}>{net >= 0 ? '+' : ''}{net}/month</div>
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
  const [treeScale, setTreeScale] = useState(1);

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
  const selectedStats = useMemo(() => {
    if (!selectedPerson) return null;
    return [
      ['Happiness', selectedPerson.stats.happiness],
      ['Love', selectedPerson.stats.love],
      ['Charm', selectedPerson.stats.charm],
      ['IQ', selectedPerson.stats.iq],
      ['Social reputation', selectedPerson.stats.socialReputation],
      ['Burnout', selectedPerson.stats.burnout],
      ['Job proficiency', selectedPerson.job?.proficiency ?? 0],
    ];
  }, [selectedPerson]);

  return (
    <section className="card wide">
      <div className="label">Family Tree</div>
      <div className="sub">Click a family member to inspect them. Use zoom for large families, and scroll horizontally if needed.</div>
      <div className="treeControls">
        <span>Zoom</span>
        <input type="range" min="60" max="110" value={Math.round(treeScale * 100)} onChange={(e) => setTreeScale(Number(e.target.value) / 100)} />
        <span>{Math.round(treeScale * 100)}%</span>
      </div>
      <div className="treeViewport">
        <div className="treeWrap" style={{ transform: `scale(${treeScale})` }}>
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
      </div>
      
      {selectedPerson ? (
        <div className="memberCard">
          <div className="memberTitle">
            {selectedPerson.avatar} {selectedPerson.name}
          </div>
          <div className="memberGrid">
            <span>Job: {selectedPerson.job.title}</span>
            <span>Salary/month: {selectedPerson.job.salaryPerSecond}</span>
            <span>Pension/month: {selectedPerson.pensionPerSecond ?? 0}</span>
            <span>Level: {selectedPerson.job.level ?? 0}</span>
          </div>
          <div className="memberStatusGrid">
            {selectedStats?.map(([label, value]) => <StatusBar key={label} label={label} value={value} />)}
          </div>
          <div className="sub">Traits: {selectedPerson.traits.join(', ')}</div>
          {selectedPerson.talent ? <div className="sub">Talent discovered: <b>{selectedPerson.talent}</b></div> : null}
        </div>
      ) : (
        <div className="memberCardHint">Select a person to see their status.</div>
      )}
    </section>
  );
}
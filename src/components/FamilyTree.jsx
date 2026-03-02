function Avatar({ icon, label }) {
  return (
    <div className="avatarNode">
      <div className="avatarBubble">{icon}</div>
      <div className="avatarLabel">{label}</div>
    </div>
  );
}

export function FamilyTree({ family, relationship }) {
  const { parentA, parentB, child } = family;

  return (
    <section className="card wide">
      <div className="label">Family Tree</div>
      <div className="treeWrap">
        <div className="treeRow top">
          <Avatar icon="👵" label="Grandma" />
          <Avatar icon="👴" label="Grandpa" />
          <Avatar icon="👵" label="Grandma" />
          <Avatar icon="👴" label="Grandpa" />
        </div>

        <div className="treeLines">└── Parents & Child Lineage ──┘</div>

        <div className="treeRow mid">
          <Avatar icon={parentA.avatar} label="Parent A" />
          <div className="heart">❤️</div>
          <Avatar icon={parentB.avatar} label="Parent B" />
        </div>

        <div className="treeConnector" />

        <div className="treeRow bottom">
          {child ? (
            <Avatar icon={child.avatar} label={`Child (${child.age}y)`} />
          ) : (
            <div className="emptyChild">No child yet</div>
          )}
        </div>
      </div>
      <div className="sub">Happiness: {relationship.happiness} • Love: {relationship.love}</div>
    </section>
  );
}
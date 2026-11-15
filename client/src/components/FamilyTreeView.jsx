import MemberCard from './MemberCard';

function buildTree(members, relationships) {
  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = { ...m, children: [], spouse: null }; });

  const parentChildRels = relationships.filter(r => r.relationship_type === 'parent_child');
  const spouseRels = relationships.filter(r => r.relationship_type === 'spouse');

  // Link spouses
  spouseRels.forEach(r => {
    if (memberMap[r.member1_id] && memberMap[r.member2_id]) {
      memberMap[r.member1_id].spouse = memberMap[r.member2_id];
      memberMap[r.member2_id].spouse = memberMap[r.member1_id];
    }
  });

  // Collect all children
  const childIds = new Set();
  parentChildRels.forEach(r => { childIds.add(r.member2_id); });

  // Assign children to parents — deduplicate so each child appears under one parent only
  const assignedChildren = new Set();
  parentChildRels.forEach(r => {
    if (!memberMap[r.member1_id] || !memberMap[r.member2_id]) return;
    if (assignedChildren.has(r.member2_id)) return;

    const parent = memberMap[r.member1_id];
    const spouse = parent.spouse;

    // If this parent is the "absorbed" spouse, and the primary also claims this child, skip
    if (spouse) {
      const isPrimaryParent = parentChildRels.some(
        pr => pr.member1_id === spouse.id && pr.member2_id === r.member2_id
      );
      const isAbsorbed = spouseRels.some(sr => sr.member2_id === r.member1_id);
      if (isAbsorbed && isPrimaryParent) return;
    }

    memberMap[r.member1_id].children.push(memberMap[r.member2_id]);
    assignedChildren.add(r.member2_id);
  });

  // For each spouse pair, one is "absorbed" into the couple display and should not appear standalone.
  // If one is a child, absorb the other (non-child). Otherwise absorb member2.
  const absorbedSpouses = new Set();
  spouseRels.forEach(r => {
    const id1 = r.member1_id;
    const id2 = r.member2_id;
    if (childIds.has(id1) && !childIds.has(id2)) {
      absorbedSpouses.add(id2);
    } else if (childIds.has(id2) && !childIds.has(id1)) {
      absorbedSpouses.add(id1);
    } else {
      absorbedSpouses.add(id2);
    }
  });

  const roots = members.filter(m => !childIds.has(m.id) && !absorbedSpouses.has(m.id));
  return roots.map(r => memberMap[r.id]);
}

function TreeNode({ node, onMemberClick }) {
  const uniqueChildren = [];
  const seen = new Set();
  (node.children || []).forEach(c => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      uniqueChildren.push(c);
    }
  });

  return (
    <div className="tree-node">
      <div className="tree-couple">
        <MemberCard member={node} onClick={() => onMemberClick(node)} />
        {node.spouse && (
          <>
            <div className="spouse-connector" />
            <MemberCard member={node.spouse} onClick={() => onMemberClick(node.spouse)} />
          </>
        )}
      </div>
      {uniqueChildren.length > 0 && (
        <div className="tree-children-wrapper">
          <div className="tree-down-line" />
          <div className="tree-children-connector">
            <div className="tree-children">
              {uniqueChildren.map(child => (
                <div className="tree-child-branch" key={child.id}>
                  <div className="tree-up-line" />
                  <TreeNode node={child} onMemberClick={onMemberClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FamilyTreeView({ members, relationships, onMemberClick }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        <h3>No family members yet</h3>
        <p>Add your first family member to start building your tree.</p>
      </div>
    );
  }

  const roots = buildTree(members, relationships);

  if (roots.length === 0 && members.length > 0) {
    return (
      <div className="tree-container">
        <div className="tree-flat-list">
          {members.map(m => (
            <MemberCard key={m.id} member={m} onClick={() => onMemberClick(m)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="tree-container">
      <div className="tree-root">
        {roots.map(root => (
          <TreeNode key={root.id} node={root} onMemberClick={onMemberClick} />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trees as treesApi, members as membersApi } from '../services/api';
import FamilyTreeView from '../components/FamilyTreeView';
import AddMemberModal from '../components/AddMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import InviteModal from '../components/InviteModal';

export default function TreeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState(null);
  const [membersList, setMembersList] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRelModal, setShowRelModal] = useState(false);
  const [relForm, setRelForm] = useState({ member1_id: '', member2_id: '', relationship_type: '' });

  useEffect(() => {
    loadTree();
  }, [id]);

  const loadTree = async () => {
    try {
      const res = await treesApi.get(id);
      setTree(res.data);
      setMembersList(res.data.members);
      setRelationships(res.data.relationships);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (formData, relationship, relatedTo) => {
    const res = await membersApi.add(id, formData);
    const newMember = res.data;

    if (relationship && relatedTo) {
      if (relationship === 'child_of') {
        await membersApi.addRelationship(id, {
          member1_id: parseInt(relatedTo),
          member2_id: newMember.id,
          relationship_type: 'parent_child'
        });
      } else if (relationship === 'parent_of') {
        await membersApi.addRelationship(id, {
          member1_id: newMember.id,
          member2_id: parseInt(relatedTo),
          relationship_type: 'parent_child'
        });
      } else if (relationship === 'spouse_of') {
        await membersApi.addRelationship(id, {
          member1_id: newMember.id,
          member2_id: parseInt(relatedTo),
          relationship_type: 'spouse'
        });
      }
    }

    loadTree();
  };

  const handleUpdateMember = async (memberId, formData) => {
    await membersApi.update(id, memberId, formData);
    loadTree();
  };

  const handleDeleteMember = async (memberId) => {
    await membersApi.delete(id, memberId);
    loadTree();
  };

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    await membersApi.addRelationship(id, relForm);
    setShowRelModal(false);
    setRelForm({ member1_id: '', member2_id: '', relationship_type: '' });
    loadTree();
  };

  if (loading) return <div className="loading-screen">Loading tree...</div>;
  if (!tree) return null;

  return (
    <div className="tree-page">
      <div className="tree-toolbar">
        <div className="tree-toolbar-left">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>← Back</button>
          <h2>{tree.name}</h2>
          <span className="badge">{tree.role}</span>
        </div>
        <div className="tree-toolbar-right">
          <button className="btn btn-outline btn-sm" onClick={() => setShowRelModal(true)}>
            Link Relationship
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowInviteModal(true)}>
            Invite Family
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Member
          </button>
        </div>
      </div>

      <FamilyTreeView
        members={membersList}
        relationships={relationships}
        onMemberClick={(m) => setEditingMember(m)}
      />

      {showAddModal && (
        <AddMemberModal
          existingMembers={membersList}
          onAdd={handleAddMember}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onUpdate={handleUpdateMember}
          onDelete={handleDeleteMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {showInviteModal && (
        <InviteModal
          treeId={id}
          members={membersList}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showRelModal && (
        <div className="modal-overlay" onClick={() => setShowRelModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link Relationship</h3>
              <button className="modal-close" onClick={() => setShowRelModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddRelationship}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Person 1</label>
                  <select value={relForm.member1_id} onChange={(e) => setRelForm({ ...relForm, member1_id: e.target.value })} required>
                    <option value="">Select</option>
                    {membersList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <select value={relForm.relationship_type} onChange={(e) => setRelForm({ ...relForm, relationship_type: e.target.value })} required>
                    <option value="">Select type</option>
                    <option value="parent_child">Parent → Child</option>
                    <option value="spouse">Spouse</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Person 2</label>
                  <select value={relForm.member2_id} onChange={(e) => setRelForm({ ...relForm, member2_id: e.target.value })} required>
                    <option value="">Select</option>
                    {membersList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                {relForm.relationship_type === 'parent_child' && (
                  <small className="form-hint">Person 1 is the parent, Person 2 is the child.</small>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowRelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

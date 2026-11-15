import { useState } from 'react';
import { invites as invitesApi } from '../services/api';

export default function InviteModal({ treeId, members, onClose }) {
  const [memberId, setMemberId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await invitesApi.create(treeId, memberId || null);
      setInviteCode(res.data.invite_code);
    } catch {
      alert('Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Invite Family Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {!inviteCode ? (
            <>
              <p>Generate an invite code to share with a family member so they can join this tree.</p>
              <div className="form-group">
                <label>Link to existing member (optional)</label>
                <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">None - just invite to view/edit</option>
                  {members.filter(m => !m.linked_user_id).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <small className="form-hint">If this person is already in the tree, link their account to their entry.</small>
              </div>
              <button onClick={handleCreate} className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Generating...' : 'Generate Invite Code'}
              </button>
            </>
          ) : (
            <div className="invite-code-display">
              <p>Share this code with your family member:</p>
              <div className="invite-code">{inviteCode}</div>
              <button onClick={handleCopy} className="btn btn-primary btn-full">
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <small className="form-hint">This code expires in 7 days.</small>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invites as invitesApi } from '../services/api';

export default function JoinTree() {
  const [code, setCode] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setInviteInfo(null);
    setLoading(true);
    try {
      const res = await invitesApi.getByCode(code.trim().toUpperCase());
      setInviteInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError('');
    try {
      await invitesApi.join(code.trim().toUpperCase());
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join tree');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Join a Family Tree</h2>
        <p className="auth-subtitle">Enter the invite code shared by a family member</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Invite Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., A1B2C3D4"
              required
              maxLength={8}
              style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Looking up...' : 'Look Up'}
          </button>
        </form>
        {inviteInfo && (
          <div className="invite-info">
            <h3>You've been invited!</h3>
            <p><strong>Tree:</strong> {inviteInfo.tree_name}</p>
            <p><strong>Invited by:</strong> {inviteInfo.invited_by_name}</p>
            <button onClick={handleJoin} className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Joining...' : 'Join This Tree'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

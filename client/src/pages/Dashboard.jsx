import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trees as treesApi } from '../services/api';

export default function Dashboard() {
  const [treeList, setTreeList] = useState([]);
  const [newTreeName, setNewTreeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrees();
  }, []);

  const loadTrees = async () => {
    try {
      const res = await treesApi.list();
      setTreeList(res.data);
    } catch {
      setError('Failed to load trees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);
    try {
      await treesApi.create(newTreeName.trim());
      setNewTreeName('');
      loadTrees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tree');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tree? This cannot be undone.')) return;
    try {
      await treesApi.delete(id);
      loadTrees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete tree');
    }
  };

  if (loading) return <div className="loading-screen">Loading your trees...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Family Trees</h1>
        <form onSubmit={handleCreate} className="create-tree-form">
          <input
            type="text"
            value={newTreeName}
            onChange={(e) => setNewTreeName(e.target.value)}
            placeholder="New tree name (e.g., Khan Family)"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating...' : '+ Create Tree'}
          </button>
        </form>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {treeList.length === 0 ? (
        <div className="empty-state">
          <h3>No family trees yet</h3>
          <p>Create your first tree above, or join an existing one with an invite code.</p>
        </div>
      ) : (
        <div className="tree-grid">
          {treeList.map((tree) => (
            <Link to={`/tree/${tree.id}`} key={tree.id} className="tree-card">
              <div className="tree-card-icon">🌳</div>
              <h3>{tree.name}</h3>
              <span className="tree-card-role">{tree.role}</span>
              <span className="tree-card-date">{new Date(tree.created_at).toLocaleDateString()}</span>
              {tree.role === 'owner' && (
                <button
                  className="tree-card-delete"
                  onClick={(e) => { e.preventDefault(); handleDelete(tree.id); }}
                  title="Delete tree"
                >
                  ×
                </button>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const express = require('express');
const db = require('../db/database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const trees = db.all(`
    SELECT ft.*, tm.role
    FROM family_trees ft
    JOIN tree_members tm ON tm.tree_id = ft.id
    WHERE tm.user_id = ?
    ORDER BY ft.created_at DESC
  `, [req.user.id]);

  res.json(trees);
});

router.post('/', authenticate, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Tree name is required' });
  }

  const result = db.run('INSERT INTO family_trees (name, created_by) VALUES (?, ?)', [name, req.user.id]);
  db.run('INSERT INTO tree_members (tree_id, user_id, role) VALUES (?, ?, ?)', [result.lastInsertRowid, req.user.id, 'owner']);

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    created_by: req.user.id,
    role: 'owner'
  });
});

router.get('/:id', authenticate, (req, res) => {
  const membership = db.get(`
    SELECT ft.*, tm.role
    FROM family_trees ft
    JOIN tree_members tm ON tm.tree_id = ft.id
    WHERE ft.id = ? AND tm.user_id = ?
  `, [req.params.id, req.user.id]);

  if (!membership) {
    return res.status(404).json({ error: 'Tree not found or access denied' });
  }

  const members = db.all('SELECT * FROM family_members WHERE tree_id = ?', [req.params.id]);
  const relationships = db.all('SELECT * FROM relationships WHERE tree_id = ?', [req.params.id]);
  const collaborators = db.all(`
    SELECT u.id, u.name, u.email, tm.role, tm.joined_at
    FROM tree_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.tree_id = ?
  `, [req.params.id]);

  res.json({
    ...membership,
    members,
    relationships,
    collaborators
  });
});

router.delete('/:id', authenticate, (req, res) => {
  const membership = db.get('SELECT role FROM tree_members WHERE tree_id = ? AND user_id = ?', [req.params.id, req.user.id]);

  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can delete this tree' });
  }

  db.run('DELETE FROM family_trees WHERE id = ?', [req.params.id]);
  res.json({ message: 'Tree deleted' });
});

module.exports = router;

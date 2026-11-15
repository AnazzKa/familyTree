const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/:treeId', authenticate, (req, res) => {
  const membership = db.get('SELECT role FROM tree_members WHERE tree_id = ? AND user_id = ?', [req.params.treeId, req.user.id]);
  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { member_id } = req.body;
  const invite_code = uuidv4().slice(0, 8).toUpperCase();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = db.run(`
    INSERT INTO invites (tree_id, invite_code, created_by, member_id, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, [req.params.treeId, invite_code, req.user.id, member_id || null, expires_at]);

  res.status(201).json({
    id: result.lastInsertRowid,
    invite_code,
    expires_at,
    member_id: member_id || null
  });
});

router.get('/code/:code', authenticate, (req, res) => {
  const invite = db.get(`
    SELECT i.*, ft.name as tree_name, u.name as invited_by_name
    FROM invites i
    JOIN family_trees ft ON ft.id = i.tree_id
    JOIN users u ON u.id = i.created_by
    WHERE i.invite_code = ? AND i.used_by IS NULL
  `, [req.params.code]);

  if (!invite) {
    return res.status(404).json({ error: 'Invalid or expired invite code' });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Invite has expired' });
  }

  res.json(invite);
});

router.post('/join/:code', authenticate, (req, res) => {
  const invite = db.get('SELECT * FROM invites WHERE invite_code = ? AND used_by IS NULL', [req.params.code]);

  if (!invite) {
    return res.status(404).json({ error: 'Invalid or used invite code' });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Invite has expired' });
  }

  const existing = db.get('SELECT id FROM tree_members WHERE tree_id = ? AND user_id = ?', [invite.tree_id, req.user.id]);
  if (existing) {
    return res.status(409).json({ error: 'You are already a member of this tree' });
  }

  db.run('INSERT INTO tree_members (tree_id, user_id, role) VALUES (?, ?, ?)', [invite.tree_id, req.user.id, 'editor']);
  db.run('UPDATE invites SET used_by = ? WHERE id = ?', [req.user.id, invite.id]);

  if (invite.member_id) {
    db.run('UPDATE family_members SET linked_user_id = ? WHERE id = ? AND tree_id = ?', [req.user.id, invite.member_id, invite.tree_id]);
  }

  const tree = db.get('SELECT * FROM family_trees WHERE id = ?', [invite.tree_id]);
  res.json({ message: 'Joined tree successfully', tree });
});

router.get('/tree/:treeId', authenticate, (req, res) => {
  const membership = db.get('SELECT role FROM tree_members WHERE tree_id = ? AND user_id = ?', [req.params.treeId, req.user.id]);
  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const invites = db.all(`
    SELECT i.*, u.name as used_by_name
    FROM invites i
    LEFT JOIN users u ON u.id = i.used_by
    WHERE i.tree_id = ?
    ORDER BY i.created_at DESC
  `, [req.params.treeId]);

  res.json(invites);
});

module.exports = router;

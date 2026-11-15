const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const authenticate = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'));
    }
  }
});

function checkTreeAccess(req, res, next) {
  const treeId = req.params.treeId;
  const membership = db.get('SELECT role FROM tree_members WHERE tree_id = ? AND user_id = ?', [treeId, req.user.id]);
  if (!membership) {
    return res.status(403).json({ error: 'Access denied to this tree' });
  }
  req.treeRole = membership.role;
  next();
}

router.get('/:treeId', authenticate, checkTreeAccess, (req, res) => {
  const members = db.all('SELECT * FROM family_members WHERE tree_id = ?', [req.params.treeId]);
  const relationships = db.all('SELECT * FROM relationships WHERE tree_id = ?', [req.params.treeId]);
  res.json({ members, relationships });
});

router.post('/:treeId', authenticate, checkTreeAccess, upload.single('photo'), (req, res) => {
  try {
    const { name, gender, date_of_birth, date_of_death, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const result = db.run(`
      INSERT INTO family_members (tree_id, name, gender, date_of_birth, date_of_death, phone, email, photo_url, added_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.treeId, name, gender || null, date_of_birth || null, date_of_death || null, phone || null, email || null, photo_url, req.user.id]);

    const member = db.get('SELECT * FROM family_members WHERE id = ?', [result.lastInsertRowid]);

    const relationshipsData = req.body.relationships;
    if (relationshipsData) {
      const rels = typeof relationshipsData === 'string' ? JSON.parse(relationshipsData) : relationshipsData;
      for (const rel of rels) {
        db.run('INSERT INTO relationships (tree_id, member1_id, member2_id, relationship_type) VALUES (?, ?, ?, ?)',
          [req.params.treeId, rel.member1_id, rel.member2_id, rel.relationship_type]);
      }
    }

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:treeId/:memberId', authenticate, checkTreeAccess, upload.single('photo'), (req, res) => {
  try {
    const existing = db.get('SELECT * FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.treeId]);
    if (!existing) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { name, gender, date_of_birth, date_of_death, phone, email } = req.body;

    let photo_url = existing.photo_url;
    if (req.file) {
      if (existing.photo_url) {
        const oldPath = path.join(__dirname, '..', existing.photo_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photo_url = `/uploads/${req.file.filename}`;
    }

    if (req.body.remove_photo === 'true' && !req.file) {
      if (existing.photo_url) {
        const oldPath = path.join(__dirname, '..', existing.photo_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photo_url = null;
    }

    db.run(`
      UPDATE family_members
      SET name = ?, gender = ?, date_of_birth = ?, date_of_death = ?, phone = ?, email = ?, photo_url = ?
      WHERE id = ? AND tree_id = ?
    `, [
      name || existing.name,
      gender ?? existing.gender,
      date_of_birth ?? existing.date_of_birth,
      date_of_death ?? existing.date_of_death,
      phone ?? existing.phone,
      email ?? existing.email,
      photo_url,
      req.params.memberId,
      req.params.treeId
    ]);

    const updated = db.get('SELECT * FROM family_members WHERE id = ?', [req.params.memberId]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:treeId/:memberId', authenticate, checkTreeAccess, (req, res) => {
  const existing = db.get('SELECT * FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.treeId]);
  if (!existing) {
    return res.status(404).json({ error: 'Member not found' });
  }

  if (existing.photo_url) {
    const filePath = path.join(__dirname, '..', existing.photo_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.run('DELETE FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.treeId]);
  res.json({ message: 'Member deleted' });
});

router.post('/:treeId/relationship', authenticate, checkTreeAccess, (req, res) => {
  const { member1_id, member2_id, relationship_type } = req.body;

  if (!member1_id || !member2_id || !relationship_type) {
    return res.status(400).json({ error: 'member1_id, member2_id, and relationship_type are required' });
  }

  const validTypes = ['parent_child', 'spouse'];
  if (!validTypes.includes(relationship_type)) {
    return res.status(400).json({ error: 'relationship_type must be parent_child or spouse' });
  }

  const result = db.run('INSERT INTO relationships (tree_id, member1_id, member2_id, relationship_type) VALUES (?, ?, ?, ?)',
    [req.params.treeId, member1_id, member2_id, relationship_type]);

  res.status(201).json({ id: result.lastInsertRowid, tree_id: parseInt(req.params.treeId), member1_id, member2_id, relationship_type });
});

router.delete('/:treeId/relationship/:relId', authenticate, checkTreeAccess, (req, res) => {
  db.run('DELETE FROM relationships WHERE id = ? AND tree_id = ?', [req.params.relId, req.params.treeId]);
  res.json({ message: 'Relationship removed' });
});

module.exports = router;

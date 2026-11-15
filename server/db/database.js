const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'familytree.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tree_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER REFERENCES family_trees(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      role TEXT DEFAULT 'editor',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tree_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER REFERENCES family_trees(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      date_of_death TEXT,
      phone TEXT,
      email TEXT,
      photo_url TEXT,
      linked_user_id INTEGER REFERENCES users(id),
      added_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER REFERENCES family_trees(id) ON DELETE CASCADE,
      member1_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
      member2_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER REFERENCES family_trees(id) ON DELETE CASCADE,
      invite_code TEXT UNIQUE NOT NULL,
      created_by INTEGER REFERENCES users(id),
      used_by INTEGER REFERENCES users(id),
      member_id INTEGER REFERENCES family_members(id),
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  save();
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0].values[0][0] };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    const row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  const cols = stmt.getColumnNames();
  while (stmt.step()) {
    const vals = stmt.get();
    const row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    rows.push(row);
  }
  stmt.free();
  return rows;
}

module.exports = { getDb, run, get, all, save };

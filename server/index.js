require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db/database');

const authRoutes = require('./routes/auth');
const treeRoutes = require('./routes/trees');
const memberRoutes = require('./routes/members');
const inviteRoutes = require('./routes/invites');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/invites', inviteRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React build in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

async function start() {
  await getDb();
  console.log('Database initialized');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);

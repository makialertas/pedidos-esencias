const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { articles: [], settings: { whatsappNumber: '', adminPassword: 'admin123' }, orders: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes

app.get('/api/articles', (req, res) => {
  const db = readDB();
  res.json(db.articles);
});

app.post('/api/articles', (req, res) => {
  const db = readDB();
  const newArticle = {
    id: Date.now(),
    name: req.body.name,
    subarticles: req.body.subarticles || []
  };
  db.articles.push(newArticle);
  writeDB(db);
  res.json(newArticle);
});

app.put('/api/articles/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.articles.findIndex(a => a.id === id);
  if (index !== -1) {
    db.articles[index] = { ...db.articles[index], ...req.body, id };
    writeDB(db);
    res.json(db.articles[index]);
  } else {
    res.status(404).json({ error: 'Artículo no encontrado' });
  }
});

app.delete('/api/articles/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.articles = db.articles.filter(a => a.id !== id);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings);
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  res.json(db.settings);
});

app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const newOrder = {
    id: Date.now(),
    date: new Date().toISOString(),
    clientData: req.body.clientData,
    items: req.body.items,
    summary: req.body.summary,
    detailed: req.body.detailed
  };
  db.orders.push(newOrder);
  writeDB(db);
  res.json(newOrder);
});

app.post('/api/admin/login', (req, res) => {
  const db = readDB();
  if (req.body.password === db.settings.adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

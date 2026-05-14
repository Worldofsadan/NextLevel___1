const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize DB on startup

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret: 'nextlevel-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // set true if using HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));

// ─── API ROUTES ───────────────────────────────────────────────────────────────

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));

// ─── FRONTEND FALLBACK ───────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────

db.ready.then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 NextLevel Store running at http://localhost:${PORT}`);
    console.log(`📦 Database: SQLite (nextlevel.db)`);
    console.log(`🛍️  API ready at /api/\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

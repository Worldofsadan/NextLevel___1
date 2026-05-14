const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'nextlevel.db');
const db = new Database(dbPath);

// ─── PRAGMAS ─────────────────────────────────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── HELPERS (async-compatible wrappers) ─────────────────────────────────────
db.run_p = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return Promise.resolve({ lastInsertRowid: result.lastInsertRowid, changes: result.changes });
};

db.get_p = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return Promise.resolve(stmt.get(...params));
};

db.all_p = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return Promise.resolve(stmt.all(...params));
};

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    category       TEXT    NOT NULL,
    description    TEXT,
    original_price REAL    NOT NULL,
    discount_pct   INTEGER NOT NULL DEFAULT 0,
    final_price    REAL    NOT NULL,
    image_url      TEXT    NOT NULL,
    sizes          TEXT    NOT NULL DEFAULT 'S,M,L,XL',
    stock          INTEGER NOT NULL DEFAULT 50,
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size        TEXT    NOT NULL DEFAULT 'M',
    quantity    INTEGER NOT NULL DEFAULT 1,
    added_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount   REAL    NOT NULL,
    total_savings  REAL    NOT NULL DEFAULT 0,
    status         TEXT    NOT NULL DEFAULT 'Ordered',
    address        TEXT,
    payment_method TEXT    DEFAULT 'COD',
    created_at     TEXT    DEFAULT (datetime('now')),
    updated_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT    NOT NULL,
    size         TEXT    NOT NULL,
    quantity     INTEGER NOT NULL DEFAULT 1,
    price        REAL    NOT NULL
  );
`);

// ─── SEED ─────────────────────────────────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
if (count.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, description, original_price, discount_pct, final_price, image_url, sizes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Urban Oversized Tee','T-Shirts','Premium 100% cotton oversized tee with dropped shoulders.',1299,30,909,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80','S,M,L,XL'],
    ['Classic Denim Jacket','Jackets','Vintage-washed denim jacket with brass buttons and chest pockets.',3999,25,2999,'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&q=80','S,M,L,XL'],
    ['Streetwear Hoodie','Hoodies','Heavyweight fleece hoodie with kangaroo pocket and adjustable drawstring.',2499,20,1999,'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80','S,M,L,XL'],
    ['Cargo Jogger Pants','Bottoms','Multi-pocket cargo joggers in ripstop fabric. Tapered fit with elastic waistband.',2299,35,1494,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80','S,M,L,XL'],
    ['Graphic Print Tee','T-Shirts','Bold abstract graphic printed on premium combed cotton.',1199,40,719,'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80','S,M,L,XL'],
    ['Bomber Jacket','Jackets','Satin bomber jacket with ribbed collar, cuffs, and hem.',4499,22,3509,'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80','S,M,L,XL'],
    ['Slim Fit Chinos','Bottoms','Stretch twill chinos in slim fit silhouette.',1999,30,1399,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80','28,30,32,34,36'],
    ['Zip-Up Sweatshirt','Hoodies','French terry zip-up sweatshirt with stand collar.',2199,15,1869,'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80','S,M,L,XL'],
    ['Linen Casual Shirt','Shirts','Breathable 100% linen shirt with relaxed fit.',1799,25,1349,'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80','S,M,L,XL'],
    ['Streetwear Co-ord Set','Sets','Matching oversized shirt and wide-leg pant set in textured fabric.',4999,20,3999,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80','S,M,L,XL'],
  ];

  const insertMany = db.transaction((prods) => {
    for (const p of prods) insert.run(...p);
  });
  insertMany(products);
  console.log('✅ Products seeded successfully');
}

module.exports = db;

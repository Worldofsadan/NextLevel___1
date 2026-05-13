const express = require('express');
const db = require('../database');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category && category !== 'All') {
    query += ' WHERE category = ?';
    params.push(category);
  }
  if (search) {
    query += params.length ? ' AND' : ' WHERE';
    query += ' (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY id';

  try {
    const products = await db.all_p(query, params);
    res.json({ success: true, products });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await db.get_p('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const rows = await db.all_p('SELECT DISTINCT category FROM products');
    const cats = rows.map(r => r.category);
    res.json({ success: true, categories: ['All', ...cats] });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

const express = require('express');
const db = require('../database');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.json({ success: false, message: 'Please login first.' });
  next();
};

// Get cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await db.all_p(`
      SELECT ci.id, ci.quantity, ci.size,
             p.id as product_id, p.name, p.final_price as price,
             p.original_price, p.discount_pct, p.image_url, p.category
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
    `, [req.session.user.id]);
    res.json({ success: true, items });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Add to cart
router.post('/add', requireAuth, async (req, res) => {
  const { product_id, size = 'M', quantity = 1 } = req.body;
  const uid = req.session.user.id;

  try {
    const existing = await db.get_p(
      'SELECT id, quantity FROM cart_items WHERE user_id=? AND product_id=? AND size=?',
      [uid, product_id, size]
    );
    if (existing) {
      await db.run_p('UPDATE cart_items SET quantity=? WHERE id=?', [existing.quantity + quantity, existing.id]);
    } else {
      await db.run_p('INSERT INTO cart_items (user_id, product_id, size, quantity) VALUES (?,?,?,?)', [uid, product_id, size, quantity]);
    }
    res.json({ success: true, message: 'Added to cart!' });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Update quantity
router.put('/update/:id', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  try {
    if (quantity < 1) {
      await db.run_p('DELETE FROM cart_items WHERE id=? AND user_id=?', [req.params.id, req.session.user.id]);
    } else {
      await db.run_p('UPDATE cart_items SET quantity=? WHERE id=? AND user_id=?', [quantity, req.params.id, req.session.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Remove item
router.delete('/remove/:id', requireAuth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM cart_items WHERE id=? AND user_id=?', [req.params.id, req.session.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Clear cart
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    await db.run_p('DELETE FROM cart_items WHERE user_id=?', [req.session.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

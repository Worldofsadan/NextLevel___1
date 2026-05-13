const express = require('express');
const db = require('../database');
const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.json({ success: false, message: 'Please login first.' });
  next();
};

// Place order
router.post('/place', requireAuth, async (req, res) => {
  const uid = req.session.user.id;
  const { address, payment_method = 'COD' } = req.body;

  try {
    const cartItems = await db.all_p(`
      SELECT ci.quantity, ci.size,
             p.id as product_id, p.name, p.final_price, p.original_price, p.discount_pct
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = ?
    `, [uid]);

    if (cartItems.length === 0)
      return res.json({ success: false, message: 'Cart is empty.' });

    let total = 0, savings = 0;
    for (const item of cartItems) {
      total += item.final_price * item.quantity;
      savings += (item.original_price - item.final_price) * item.quantity;
    }

    const order = await db.run_p(
      'INSERT INTO orders (user_id, total_amount, total_savings, address, payment_method) VALUES (?,?,?,?,?)',
      [uid, total, savings, address || 'Not specified', payment_method]
    );

    const oid = order.lastInsertRowid;
    for (const item of cartItems) {
      await db.run_p(
        'INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price) VALUES (?,?,?,?,?,?)',
        [oid, item.product_id, item.name, item.size, item.quantity, item.final_price]
      );
    }

    await db.run_p('DELETE FROM cart_items WHERE user_id=?', [uid]);
    res.json({ success: true, message: 'Order placed!', orderId: oid });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Get user orders
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await db.all_p(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.session.user.id]);

    const result = [];
    for (const order of orders) {
      const items = await db.all_p('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      result.push({ ...order, items });
    }

    res.json({ success: true, orders: result });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Cancel order
router.put('/cancel/:id', requireAuth, async (req, res) => {
  try {
    const order = await db.get_p('SELECT * FROM orders WHERE id=? AND user_id=?', [req.params.id, req.session.user.id]);
    if (!order) return res.json({ success: false, message: 'Order not found.' });
    if (order.status !== 'Ordered') return res.json({ success: false, message: 'Only "Ordered" status can be cancelled.' });

    await db.run_p("UPDATE orders SET status='Cancelled', updated_at=datetime('now') WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

// Admin: advance order status
router.put('/advance/:id', requireAuth, async (req, res) => {
  const flow = { 'Ordered': 'Shipping', 'Shipping': 'Done' };
  try {
    const order = await db.get_p('SELECT * FROM orders WHERE id=?', [req.params.id]);
    if (!order) return res.json({ success: false, message: 'Order not found.' });
    const next = flow[order.status];
    if (!next) return res.json({ success: false, message: 'Cannot advance further.' });

    await db.run_p("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?", [next, req.params.id]);
    res.json({ success: true, message: `Status updated to ${next}` });
  } catch (err) {
    res.json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;

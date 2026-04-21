// backend/routes/support.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// POST /api/support - Submit a support message
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, subject, message, order_id } = req.body;
    const user_id = req.user?.id || null;

    const [result] = await db.execute(
      'INSERT INTO support_messages (user_id, name, email, subject, message, order_id) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, name, email, subject || null, message, order_id || null]
    );
    res.status(201).json({ message: 'Support request submitted successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

// GET /api/support - Admin: get all messages
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM support_messages WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const [messages] = await db.execute(query, params);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// PATCH /api/support/:id/reply - Admin reply
router.patch('/:id/reply', authenticate, adminOnly, [
  body('reply').trim().notEmpty(),
], async (req, res) => {
  try {
    const { reply } = req.body;
    await db.execute(
      'UPDATE support_messages SET admin_reply = ?, status = "resolved", replied_at = NOW() WHERE id = ?',
      [reply, req.params.id]
    );
    res.json({ message: 'Reply sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

module.exports = router;

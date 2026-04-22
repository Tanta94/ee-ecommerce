const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const db      = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');

router.post('/', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('message').trim().isLength({ min: 10 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, subject, message, order_id } = req.body;
    const user_id = req.user?.id || null;
    const [result] = await db.execute(
      'INSERT INTO support_messages (user_id, name, email, subject, message, order_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [user_id, name, email, subject||null, message, order_id||null]
    );
    res.status(201).json({ message: 'Support request submitted', id: result[0]?.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM support_messages WHERE 1=1';
    const params = [];
    let i = 1;
    if (status) { query += ` AND status = $${i++}`; params.push(status); }
    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    params.push(parseInt(limit), (parseInt(page)-1)*parseInt(limit));
    const [messages] = await db.execute(query, params);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.patch('/:id/reply', authenticate, adminOnly, async (req, res) => {
  try {
    const { reply } = req.body;
    await db.execute(
      "UPDATE support_messages SET admin_reply = $1, status = 'resolved', replied_at = NOW() WHERE id = $2",
      [reply, req.params.id]
    );
    res.json({ message: 'Reply sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

module.exports = router;

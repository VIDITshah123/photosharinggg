const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../modules/authentication/backend');

// GET /api/users - Get all users
router.get('/', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const sql = 'SELECT user_id as id, first_name, last_name FROM users_master';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(rows);
  });
});

module.exports = router;

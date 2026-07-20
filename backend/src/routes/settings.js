const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/v1/settings
router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT `key`, `value`, description FROM settings ORDER BY id');
    const settings = {};
    rows.forEach(r => { settings[r.key] = { value: r.value, description: r.description }; });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/settings — Bulk update
router.put('/', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const updates = req.body; // { key: value, ... }

    // Validate that all keys exist in settings table
    const [existingSettings] = await conn.query('SELECT `key` FROM settings');
    const validKeys = new Set(existingSettings.map(s => s.key));

    const invalidKeys = Object.keys(updates).filter(key => !validKeys.has(key));
    if (invalidKeys.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid setting keys: ${invalidKeys.join(', ')}`
      });
    }

    for (const [key, value] of Object.entries(updates)) {
      await conn.query(
        'UPDATE settings SET `value` = ? WHERE `key` = ?',
        [String(value), key]
      );
    }
    await conn.commit();
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;

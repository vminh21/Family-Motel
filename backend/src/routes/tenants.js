const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/v1/tenants
router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, r.room_number, r.name AS room_name, r.base_rent
      FROM tenants t
      JOIN rooms r ON r.id = t.room_id
      WHERE t.is_active = 1
      ORDER BY r.room_number
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tenants/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, r.room_number, r.name AS room_name FROM tenants t
       JOIN rooms r ON r.id = t.room_id WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenants
router.post('/', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { room_id, full_name, phone, id_card, deposit_amount, num_of_people, start_date, notes } = req.body;

    if (!room_id || !full_name || !start_date) {
      return res.status(400).json({ success: false, message: 'room_id, full_name, start_date are required' });
    }

    // Check room availability
    const [existing] = await conn.query(
      'SELECT id FROM tenants WHERE room_id = ? AND is_active = 1',
      [room_id]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Room already occupied' });
    }

    const [result] = await conn.query(
      `INSERT INTO tenants (room_id, full_name, phone, id_card, deposit_amount, num_of_people, start_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [room_id, full_name, phone, id_card, deposit_amount || 0, num_of_people || 1, start_date, notes]
    );

    await conn.query('UPDATE rooms SET status = ? WHERE id = ?', ['occupied', room_id]);
    await conn.commit();

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Tenant created' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// PUT /api/v1/tenants/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { full_name, phone, id_card, deposit_amount, num_of_people, notes } = req.body;
    const [result] = await pool.query(
      `UPDATE tenants SET
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        id_card = COALESCE(?, id_card),
        deposit_amount = COALESCE(?, deposit_amount),
        num_of_people = COALESCE(?, num_of_people),
        notes = COALESCE(?, notes)
       WHERE id = ? AND is_active = 1`,
      [full_name, phone, id_card, deposit_amount, num_of_people, notes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.json({ success: true, message: 'Tenant updated' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/tenants/:id — Soft delete (check-out)
router.delete('/:id', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT room_id FROM tenants WHERE id = ? AND is_active = 1', [req.params.id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const { room_id } = rows[0];
    await conn.query('UPDATE tenants SET is_active = 0 WHERE id = ?', [req.params.id]);
    await conn.query('UPDATE rooms SET status = ? WHERE id = ?', ['vacant', room_id]);
    await conn.commit();
    res.json({ success: true, message: 'Tenant checked out' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;

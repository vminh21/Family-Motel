const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/v1/rooms — List all rooms with current tenant info
router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*,
        t.id AS tenant_id,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        t.num_of_people,
        t.deposit_amount,
        t.start_date
      FROM rooms r
      LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = 1
      ORDER BY r.room_number
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/rooms/:id — Get single room detail
router.get('/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*,
        t.id AS tenant_id, t.full_name AS tenant_name, t.phone AS tenant_phone,
        t.num_of_people, t.deposit_amount, t.start_date, t.notes
      FROM rooms r
      LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = 1
      WHERE r.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/rooms/:id — Update room info
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { name, base_rent, electricity_method, electricity_flat_amount, water_method, water_fixed_amount } = req.body;
    const [result] = await pool.query(
      `UPDATE rooms SET 
        name = COALESCE(?, name), 
        base_rent = COALESCE(?, base_rent),
        electricity_method = COALESCE(?, electricity_method),
        electricity_flat_amount = COALESCE(?, electricity_flat_amount),
        water_method = COALESCE(?, water_method),
        water_fixed_amount = COALESCE(?, water_fixed_amount)
       WHERE id = ?`,
      [name, base_rent, electricity_method, electricity_flat_amount, water_method, water_fixed_amount, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, message: 'Room updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

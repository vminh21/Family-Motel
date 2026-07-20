const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// GET /api/v1/equipments (Lấy toàn bộ thiết bị)
router.get('/', auth, async (req, res, next) => {
  try {
    const [equipments] = await pool.query(`
      SELECT e.*, r.room_number, r.name as room_name 
      FROM equipments e 
      JOIN rooms r ON e.room_id = r.id 
      ORDER BY r.room_number ASC, e.id ASC
    `);
    res.json({ success: true, data: equipments });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/equipments/room/:room_id
router.get('/room/:room_id', auth, async (req, res, next) => {
  try {
    const roomId = req.params.room_id;
    
    // Check if room has equipments
    let [equipments] = await pool.query(
      'SELECT * FROM equipments WHERE room_id = ? ORDER BY id ASC',
      [roomId]
    );

    // Auto initialize if empty
    if (equipments.length === 0) {
      await pool.query(
        `INSERT INTO equipments (room_id, name, status) VALUES 
         (?, 'Tủ quần áo', 'normal'),
         (?, 'Giường ngủ', 'normal'),
         (?, 'Điều hoà', 'normal')`,
        [roomId, roomId, roomId]
      );
      
      const [newEqs] = await pool.query(
        'SELECT * FROM equipments WHERE room_id = ? ORDER BY id ASC',
        [roomId]
      );
      equipments = newEqs;
    }

    res.json({ success: true, data: equipments });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/equipments/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const [result] = await pool.query(
      'UPDATE equipments SET status = ?, notes = ? WHERE id = ?',
      [status, notes || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Cập nhật thiết bị thành công' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/equipments
router.post('/', auth, async (req, res, next) => {
  try {
    const { room_id, name, status, notes } = req.body;
    if (!room_id || !name || !status) {
      return res.status(400).json({ success: false, message: 'room_id, name, and status are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO equipments (room_id, name, status, notes) VALUES (?, ?, ?, ?)',
      [room_id, name, status, notes || null]
    );

    res.status(201).json({ success: true, message: 'Đã thêm thiết bị mới', id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/equipments/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM equipments WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    res.json({ success: true, message: 'Đã xoá thiết bị' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

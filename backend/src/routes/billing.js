const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { calculateAndCreateInvoices } = require('../services/billingService');

const router = express.Router();

// GET /api/v1/billing/cycles
router.get('/cycles', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM billing_cycles ORDER BY year DESC, month DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/billing/cycles — Create new billing cycle
router.post('/cycles', auth, async (req, res, next) => {
  try {
    const { month, year, total_electricity_amount, shared_rooms_count } = req.body;
    if (!month || !year || total_electricity_amount === undefined || !shared_rooms_count) {
      return res.status(400).json({ success: false, message: 'month, year, total_electricity_amount, shared_rooms_count are required' });
    }

    // Kiểm tra kỳ thanh toán đã chốt
    const [existing] = await pool.query(
      'SELECT id, status FROM billing_cycles WHERE month = ? AND year = ?',
      [month, year]
    );
    if (existing.length > 0 && existing[0].status === 'finalized') {
      return res.status(400).json({
        success: false, 
        message: `Tháng ${month}/${year} đã chốt hóa đơn. Vui lòng vào Danh Sách Hoá Đơn để huỷ kỳ này nếu muốn tính lại.`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO billing_cycles (month, year, total_electricity_amount, shared_rooms_count)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_electricity_amount = VALUES(total_electricity_amount),
         shared_rooms_count = VALUES(shared_rooms_count),
         status = 'draft'`,
      [month, year, total_electricity_amount, shared_rooms_count]
    );
    const insertId = result.insertId || (await pool.query(
      'SELECT id FROM billing_cycles WHERE month = ? AND year = ?', [month, year]
    ))[0][0].id;
    res.status(201).json({ success: true, data: { id: insertId, month, year, shared_rooms_count } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/billing/cycles/:cycleId/readings — Save water readings
router.post('/cycles/:cycleId/readings', auth, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { readings } = req.body; // [{ room_id, electricity_method, electricity_flat_amount, water_method, water_fixed_amount }]
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ success: false, message: 'readings array is required' });
    }
    for (const r of readings) {
      // 1. Insert into monthly_readings for this cycle
      await conn.query(
        `INSERT INTO monthly_readings (billing_cycle_id, room_id, electricity_method, electricity_flat_amount, water_method, water_fixed_amount)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           electricity_method = VALUES(electricity_method),
           electricity_flat_amount = VALUES(electricity_flat_amount),
           water_method = VALUES(water_method),
           water_fixed_amount = VALUES(water_fixed_amount)`,
        [
          req.params.cycleId,
          r.room_id,
          r.electricity_method || 'shared',
          r.electricity_flat_amount || 0,
          r.water_method || 'free',
          r.water_fixed_amount || 0
        ]
      );

      // 2. Update defaults to rooms table for next time
      await conn.query(
        `UPDATE rooms SET 
           electricity_method = ?,
           electricity_flat_amount = ?,
           water_method = ?,
           water_fixed_amount = ?
         WHERE id = ?`,
        [
          r.electricity_method || 'shared',
          r.electricity_flat_amount || 0,
          r.water_method || 'free',
          r.water_fixed_amount || 0,
          r.room_id
        ]
      );
    }
    await conn.commit();
    res.json({ success: true, message: `Saved ${readings.length} readings` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// POST /api/v1/billing/cycles/:cycleId/calculate — Run billing engine
router.post('/cycles/:cycleId/calculate', auth, async (req, res, next) => {
  try {
    const result = await calculateAndCreateInvoices(parseInt(req.params.cycleId));
    res.json({
      success: true,
      message: `Đã tạo ${result.invoices_created} hóa đơn thành công.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/billing/invoices
router.get('/invoices', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, r.room_number, r.name AS room_name,
             bc.month, bc.year
      FROM invoices i
      JOIN rooms r ON r.id = i.room_id
      JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
      ORDER BY bc.year DESC, bc.month DESC, r.room_number
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/billing/invoices/:id
router.get('/invoices/:id', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, r.room_number, r.name AS room_name, bc.month, bc.year
       FROM invoices i
       JOIN rooms r ON r.id = i.room_id
       JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const invoice = rows[0];
    invoice.snapshot_json = typeof invoice.snapshot_json === 'string'
      ? JSON.parse(invoice.snapshot_json)
      : invoice.snapshot_json;
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/billing/invoices/:id — Delete invoice
router.delete('/invoices/:id', auth, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/billing/invoices/:id — Update invoice adjustments
router.put('/invoices/:id', auth, async (req, res, next) => {
  try {
    const { adjustment_reason, adjustment_amount } = req.body;
    
    const [rows] = await pool.query(
      'SELECT base_rent, electricity_amount, water_amount, wifi_amount, trash_amount FROM invoices WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    const inv = rows[0];
    const newAdjustment = parseFloat(adjustment_amount) || 0;
    const newTotal = parseFloat(inv.base_rent) + parseFloat(inv.electricity_amount) + parseFloat(inv.water_amount) + parseFloat(inv.wifi_amount) + parseFloat(inv.trash_amount) + newAdjustment;

    const [result] = await pool.query(
      'UPDATE invoices SET adjustment_reason = ?, adjustment_amount = ?, total_amount = ? WHERE id = ?',
      [adjustment_reason || null, newAdjustment, newTotal, req.params.id]
    );

    res.json({ success: true, message: 'Đã cập nhật khoản điều chỉnh' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/billing/invoices/:id/status — Toggle invoice payment status
router.put('/invoices/:id/status', auth, async (req, res, next) => {
  try {
    const { is_paid, payment_date } = req.body;
    if (is_paid === undefined) {
      return res.status(400).json({ success: false, message: 'is_paid is required' });
    }
    const [result] = await pool.query(
      'UPDATE invoices SET is_paid = ?, payment_date = ? WHERE id = ?',
      [is_paid ? 1 : 0, payment_date || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Đã cập nhật trạng thái thanh toán' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/billing/cycles/:id — Delete entire billing cycle
router.delete('/cycles/:id', auth, async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM billing_cycles WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Billing cycle not found' });
    }

    res.json({ success: true, message: 'Đã huỷ toàn bộ hoá đơn của kỳ này' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

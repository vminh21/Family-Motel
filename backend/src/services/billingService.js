const pool = require('../config/db');

/**
 * Core billing engine.
 * Reads cycle + settings, computes all invoice line items, and persists to DB.
 * @param {number} cycleId
 * @returns {Object} Summary of created invoices
 */
async function calculateAndCreateInvoices(cycleId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get billing cycle
    const [cycles] = await conn.query('SELECT * FROM billing_cycles WHERE id = ?', [cycleId]);
    if (cycles.length === 0) throw Object.assign(new Error('Billing cycle not found'), { status: 404 });
    const cycle = cycles[0];

    if (cycle.status === 'finalized') {
      throw Object.assign(new Error('This billing cycle has already been finalized'), { status: 409 });
    }

    // 2. Get settings
    const [settingRows] = await conn.query('SELECT `key`, `value` FROM settings');
    const settings = {};
    settingRows.forEach(r => { settings[r.key] = r.value; });

    const wifiFeePerRoom = parseFloat(settings['wifi_fee_per_room'] || 100000);
    const trashFeePerRoom = parseFloat(settings['trash_fee_per_room'] || 100000);

    // 3. Get occupied rooms with their configurations + readings for this cycle
    const [rooms] = await conn.query(`
      SELECT r.id, r.room_number, r.name, r.base_rent,
             r.electricity_method, r.electricity_flat_amount,
             r.water_method, r.water_fixed_amount,
             t.full_name AS tenant_name, t.num_of_people,
             mr.electricity_method AS mr_electricity_method, mr.electricity_flat_amount AS mr_electricity_flat_amount,
             mr.water_method AS mr_water_method, mr.water_fixed_amount AS mr_water_fixed_amount
      FROM rooms r
      JOIN tenants t ON t.room_id = r.id AND t.is_active = 1
      LEFT JOIN monthly_readings mr ON mr.room_id = r.id AND mr.billing_cycle_id = ?
      ORDER BY r.room_number
    `, [cycleId]);

    if (rooms.length === 0) {
      throw Object.assign(new Error('No occupied rooms found for this billing cycle'), { status: 422 });
    }

    const occupiedCount = rooms.length;

    // 4. Calculate invoices
    const invoiceIds = [];
    const createdInvoices = [];

    for (const room of rooms) {
      const baseRent = parseFloat(room.base_rent);
      const waterReading = parseFloat(room.water_reading || 0);

      // Electricity - Calculate based on room configuration
      let electricityAmount = 0;
      const roomElecMethod = room.mr_electricity_method || room.electricity_method || 'shared';
      const roomElecFlatAmount = room.mr_electricity_flat_amount !== null && room.mr_electricity_flat_amount !== undefined ? room.mr_electricity_flat_amount : room.electricity_flat_amount;

      if (roomElecMethod === 'shared') {
        // Divide total electricity amount by number of shared rooms
        const sharedRoomsCount = Math.max(1, parseInt(cycle.shared_rooms_count) || 1);
        const totalElectricityAmount = parseFloat(cycle.total_electricity_amount || 0);
        electricityAmount = Math.round(totalElectricityAmount / sharedRoomsCount);
      } else if (roomElecMethod === 'flat_rate') {
        // Use the fixed amount configured for this room
        electricityAmount = parseFloat(roomElecFlatAmount || 0);
      } else if (roomElecMethod === 'free') {
        // No charge for electricity
        electricityAmount = 0;
      }

      // Water - Calculate based on room configuration
      let waterAmount = 0;
      const roomWaterMethod = room.mr_water_method || room.water_method || 'free';
      const roomWaterFixedAmount = room.mr_water_fixed_amount !== null && room.mr_water_fixed_amount !== undefined ? room.mr_water_fixed_amount : room.water_fixed_amount;
      
      if (roomWaterMethod === 'fixed') {
        waterAmount = parseFloat(roomWaterFixedAmount || 0);
      } else {
        // free
        waterAmount = 0;
      }

      // Wifi & Trash
      const wifiAmount = wifiFeePerRoom;
      const trashAmount = trashFeePerRoom;

      // Total
      const totalAmount = Math.round(baseRent + electricityAmount + waterAmount + wifiAmount + trashAmount);

      // Snapshot
      const snapshot = {
        billing_period: `Tháng ${cycle.month}/${cycle.year}`,
        room: { id: room.id, room_number: room.room_number, name: room.name },
        tenant: { full_name: room.tenant_name, num_of_people: room.num_of_people },
        line_items: {
          base_rent: baseRent,
          electricity: {
            method: roomElecMethod,
            total_electricity_amount: parseFloat(cycle.total_electricity_amount || 0),
            shared_rooms_count: cycle.shared_rooms_count,
            flat_amount: roomElecMethod === 'flat_rate' ? parseFloat(roomElecFlatAmount) : null,
            amount: electricityAmount,
          },
          water: {
            method: roomWaterMethod,
            flat_amount: roomWaterMethod === 'fixed' ? parseFloat(roomWaterFixedAmount || 0) : null,
            amount: waterAmount,
          },
          wifi: { amount: wifiAmount },
          trash: { amount: trashAmount },
        },
        total_amount: totalAmount,
      };

      // Delete existing invoice for this room+cycle if re-calculating
      await conn.query(
        'DELETE FROM invoices WHERE billing_cycle_id = ? AND room_id = ?',
        [cycleId, room.id]
      );

      const [insertResult] = await conn.query(
        `INSERT INTO invoices
          (billing_cycle_id, room_id, tenant_name, base_rent, electricity_amount,
           water_amount, wifi_amount, trash_amount, total_amount, snapshot_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cycleId, room.id, room.tenant_name,
          baseRent, electricityAmount, waterAmount, wifiAmount, trashAmount, totalAmount,
          JSON.stringify(snapshot),
        ]
      );

      invoiceIds.push(insertResult.insertId);
      createdInvoices.push({ invoice_id: insertResult.insertId, room: room.room_number, total: totalAmount });
    }

    // 5. Mark cycle as finalized
    await conn.query('UPDATE billing_cycles SET status = ? WHERE id = ?', ['finalized', cycleId]);

    await conn.commit();
    return { invoices_created: invoiceIds.length, billing_cycle_id: cycleId, invoice_ids: invoiceIds, invoices: createdInvoices };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { calculateAndCreateInvoices };

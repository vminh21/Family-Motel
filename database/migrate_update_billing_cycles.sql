-- Migration: Update billing_cycles to use total electricity amount
-- This allows inputting total electricity cost instead of KWh

USE family_motel_db;

-- Add new column for total electricity amount
ALTER TABLE billing_cycles
ADD COLUMN total_electricity_amount DECIMAL(12, 0) NOT NULL DEFAULT 0
  COMMENT 'Tổng tiền điện để chia cho các phòng shared (VNĐ)'
  AFTER total_electricity_kwh;

-- Make old columns optional (for backward compatibility during transition)
ALTER TABLE billing_cycles
MODIFY COLUMN total_electricity_kwh DECIMAL(10, 2) DEFAULT 0,
MODIFY COLUMN electricity_unit_price DECIMAL(10, 0) DEFAULT 0;

-- Show updated structure
DESCRIBE billing_cycles;

SELECT 'Migration completed successfully!' AS status;

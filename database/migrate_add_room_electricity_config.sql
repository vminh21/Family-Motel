-- Migration: Add electricity configuration to rooms table
-- Run this to add per-room electricity configuration

USE family_motel_db;

-- Add electricity configuration columns to rooms table
ALTER TABLE rooms 
ADD COLUMN electricity_method ENUM('shared', 'flat_rate', 'free') NOT NULL DEFAULT 'shared' 
  COMMENT 'Phương thức tính điện: shared (chia đều), flat_rate (cố định), free (miễn phí)' 
  AFTER base_rent,
ADD COLUMN electricity_flat_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 
  COMMENT 'Số tiền điện cố định (nếu method = flat_rate)' 
  AFTER electricity_method;

-- Update existing rooms with default configuration
UPDATE rooms SET electricity_method = 'shared', electricity_flat_amount = 0;

-- Show updated structure
DESCRIBE rooms;

SELECT 'Migration completed successfully!' AS status;

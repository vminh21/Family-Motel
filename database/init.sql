-- ============================================================
-- Family Motel Management — Database Initialization
-- MySQL 8.0 / 8.4
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if exist (for re-init)
DROP TABLE IF EXISTS equipments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS monthly_readings;
DROP TABLE IF EXISTS billing_cycles;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: rooms
-- ============================================================
CREATE TABLE rooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE COMMENT 'e.g. P.01',
  name VARCHAR(100) NOT NULL,
  base_rent DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Tiền thuê cơ bản (VNĐ)',
  electricity_method ENUM('shared', 'flat_rate', 'free') NOT NULL DEFAULT 'shared' COMMENT 'Phương thức tính điện: shared (chia đều), flat_rate (cố định), free (miễn phí)',
  electricity_flat_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Số tiền điện cố định (nếu method = flat_rate)',
  water_method ENUM('free', 'fixed') NOT NULL DEFAULT 'free' COMMENT 'Phương thức tính tiền nước',
  water_fixed_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Số tiền nước cố định nếu method là fixed',
  status ENUM('occupied', 'vacant') NOT NULL DEFAULT 'vacant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: tenants
-- ============================================================
CREATE TABLE tenants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  id_card VARCHAR(30),
  deposit_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Tiền đặt cọc (VNĐ)',
  num_of_people TINYINT UNSIGNED NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  notes TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tenants_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: settings
-- ============================================================
CREATE TABLE settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(80) NOT NULL UNIQUE,
  `value` VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: billing_cycles
-- ============================================================
CREATE TABLE billing_cycles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  month TINYINT UNSIGNED NOT NULL COMMENT '1-12',
  year SMALLINT UNSIGNED NOT NULL,
  total_electricity_kwh DECIMAL(10, 2) DEFAULT 0,
  total_electricity_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Tổng tiền điện để chia cho các phòng shared (VNĐ)',
  electricity_unit_price DECIMAL(10, 0) DEFAULT 0 COMMENT 'VNĐ/KWh',
  shared_rooms_count TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Số phòng chia điện chung',
  status ENUM('draft', 'finalized') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_billing_month_year (month, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: monthly_readings
-- ============================================================
CREATE TABLE monthly_readings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  billing_cycle_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  water_reading DECIMAL(8, 2) NOT NULL DEFAULT 0 COMMENT 'Số khối nước (m³)',
  electricity_method ENUM('shared', 'flat_rate', 'free') NOT NULL DEFAULT 'shared' COMMENT 'Phương thức điện',
  electricity_flat_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Tiền điện khoán nếu method là flat_rate',
  water_method ENUM('free', 'fixed') NULL COMMENT 'Phương thức nước cho kỳ này',
  water_fixed_amount DECIMAL(12, 0) NULL COMMENT 'Số tiền nước cố định kỳ này',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reading_cycle_room (billing_cycle_id, room_id),
  CONSTRAINT fk_readings_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE CASCADE,
  CONSTRAINT fk_readings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: invoices
-- ============================================================
CREATE TABLE invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  billing_cycle_id INT UNSIGNED NOT NULL,
  room_id INT UNSIGNED NOT NULL,
  tenant_name VARCHAR(150),
  base_rent DECIMAL(12, 0) NOT NULL DEFAULT 0,
  electricity_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  water_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  wifi_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  trash_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT 0,
  payment_date DATE NULL,
  adjustment_reason VARCHAR(255) NULL,
  adjustment_amount DECIMAL(12, 0) NOT NULL DEFAULT 0,
  snapshot_json JSON COMMENT 'Snapshot toàn bộ chi tiết tính toán',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: equipments
-- ============================================================
CREATE TABLE equipments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id INT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  status ENUM('new', 'normal', 'damaged') NOT NULL DEFAULT 'normal',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equip_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin account (password: admin@123)
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2a$10$fe8AmCI58GwF8.qzwrZPjery7ednFa5fx2veN9pXqz9rTJkxhVQKy');

-- 3 Rooms
INSERT INTO rooms (room_number, name, base_rent, status) VALUES
('P.01', 'Phòng 1', 2500000, 'occupied'),
('P.02', 'Phòng 2', 2500000, 'occupied'),
('P.03', 'Phòng 3', 2500000, 'vacant');

-- Sample Tenants
INSERT INTO tenants (room_id, full_name, phone, deposit_amount, num_of_people, start_date, notes) VALUES
(1, 'Nguyễn Văn An', '0901234567', 5000000, 2, '2025-01-01', 'Gửi 1 xe máy'),
(2, 'Trần Thị Bình', '0912345678', 5000000, 1, '2025-03-01', NULL);

-- Update room status
UPDATE rooms SET status = 'occupied' WHERE id IN (1, 2);

-- Default Settings
INSERT INTO settings (`key`, `value`, description) VALUES
('wifi_fee_per_room', '100000', 'Tiền Wifi / phòng / tháng (VNĐ)'),
('trash_fee_per_room', '100000', 'Tiền Rác & Sinh hoạt / phòng / tháng (VNĐ)'),
('water_method', 'metered', 'Phương thức tính nước: metered (theo khối) | free (miễn phí)'),
('water_unit_price', '15000', 'Đơn giá nước (VNĐ/khối) - chỉ áp dụng khi method = metered'),
('payment_bank_code', '', 'Mã ngân hàng (VCB, MB, TCB, Momo...)'),
('payment_account_no', '', 'Số tài khoản nhận tiền'),
('payment_account_name', '', 'Tên chủ tài khoản in hoa không dấu');

USE family_motel_db;

ALTER TABLE monthly_readings 
ADD COLUMN water_method ENUM('free', 'fixed') NULL COMMENT 'Phương thức nước cho kỳ này',
ADD COLUMN water_fixed_amount DECIMAL(12, 0) NULL COMMENT 'Số tiền nước cố định kỳ này';

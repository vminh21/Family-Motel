USE family_motel_db;

-- Thêm tuỳ chọn cấu hình Nước (Miễn phí hoặc Cố định)
ALTER TABLE rooms 
ADD COLUMN water_method ENUM('free', 'fixed') NOT NULL DEFAULT 'free' COMMENT 'Phương thức tính tiền nước',
ADD COLUMN water_fixed_amount DECIMAL(12, 0) NOT NULL DEFAULT 0 COMMENT 'Số tiền nước cố định nếu method là fixed';

-- Đảm bảo dữ liệu cũ không bị lỗi nếu như trước đây dùng cấu hình khác. 
-- Mặc định coi tất cả là miễn phí, người dùng tự cấu hình lại sau.

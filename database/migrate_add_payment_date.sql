-- Thêm cột payment_date vào bảng invoices
ALTER TABLE invoices
ADD COLUMN payment_date DATE NULL;

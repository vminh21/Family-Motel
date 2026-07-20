# 🎉 Changelog - Tính Năng Mới

**Ngày:** 17/07/2026  
**Phiên bản:** 2.0

---

## 📝 Tổng Quan

Đã thực hiện các thay đổi lớn theo yêu cầu:
1. ✅ **Xóa hóa đơn**
2. ✅ **Cấu hình điện cho từng phòng**
3. ✅ **Nhập tổng tiền điện** (thay vì KWh)
4. ✅ **Tự động chia tiền điện** cho các phòng shared

---

## 🔧 Thay Đổi Backend

### 1. **Database Migrations**

Đã thêm 2 migrations:

#### Migration 1: Thêm cấu hình điện vào rooms
```sql
-- File: database/migrate_add_room_electricity_config.sql
ALTER TABLE rooms 
ADD COLUMN electricity_method ENUM('shared', 'flat_rate', 'free') DEFAULT 'shared',
ADD COLUMN electricity_flat_amount DECIMAL(12, 0) DEFAULT 0;
```

**Giải thích:**
- `electricity_method`: Phương thức tính điện cho phòng
  - `shared`: Chia đều (chia tổng tiền điện)
  - `flat_rate`: Cố định (số tiền cố định mỗi tháng)
  - `free`: Miễn phí
- `electricity_flat_amount`: Số tiền điện cố định (nếu chọn flat_rate)

#### Migration 2: Thêm total_electricity_amount vào billing_cycles
```sql
-- File: database/migrate_update_billing_cycles.sql
ALTER TABLE billing_cycles
ADD COLUMN total_electricity_amount DECIMAL(12, 0) DEFAULT 0;
```

**Giải thích:**
- `total_electricity_amount`: Tổng tiền điện trong tháng (sẽ chia cho các phòng shared)

---

### 2. **API Endpoints Mới/Cập Nhật**

#### ✅ DELETE Invoice
```
DELETE /api/v1/billing/invoices/:id
```
**Tính năng:** Xóa hóa đơn theo ID

**Response:**
```json
{
  "success": true,
  "message": "Invoice deleted successfully"
}
```

---

#### ✅ PATCH Room (Cập nhật)
```
PATCH /api/v1/rooms/:id
```
**Body mới:**
```json
{
  "name": "Phòng 1",
  "base_rent": 2500000,
  "electricity_method": "shared",        // Mới!
  "electricity_flat_amount": 0           // Mới!
}
```

**Electricity Methods:**
- `"shared"`: Chia đều tiền điện
- `"flat_rate"`: Điện cố định (ví dụ: 500,000đ)
- `"free"`: Miễn phí điện

---

#### ✅ POST Billing Cycle (Thay đổi lớn)
```
POST /api/v1/billing/cycles
```

**Body CŨ (không dùng nữa):**
```json
{
  "month": 7,
  "year": 2026,
  "total_electricity_kwh": 590,         // ❌ Không cần
  "electricity_unit_price": 3500,       // ❌ Không cần
  "shared_rooms_count": 2               // ❌ Không cần
}
```

**Body MỚI:**
```json
{
  "month": 7,
  "year": 2026,
  "total_electricity_amount": 1500000   // ✅ Chỉ cần tổng tiền!
}
```

**Giải thích:**
- Hệ thống tự động đếm số phòng có `electricity_method = 'shared'`
- Tự động chia `total_electricity_amount` cho các phòng shared
- Phòng `flat_rate` dùng số tiền đã cấu hình
- Phòng `free` = 0 đồng

---

### 3. **Logic Tính Toán Mới**

#### Cách hệ thống tính tiền điện:

1. **Phòng SHARED (chia đều):**
   ```
   Tiền điện phòng = Tổng tiền điện / Số phòng chia
   
   Ví dụ:
   - Tổng tiền điện: 1,500,000đ
   - Phòng 1: shared
   - Phòng 2: shared
   - Phòng 3: flat_rate (500,000đ)
   
   → Phòng 1: 1,500,000 / 2 = 750,000đ
   → Phòng 2: 1,500,000 / 2 = 750,000đ
   → Phòng 3: 500,000đ (cố định)
   ```

2. **Phòng FLAT_RATE (cố định):**
   ```
   Tiền điện = electricity_flat_amount
   ```

3. **Phòng FREE (miễn phí):**
   ```
   Tiền điện = 0đ
   ```

---

## 🎯 Cách Sử Dụng Mới

### Bước 1: Cấu hình phòng (một lần)

Sử dụng API để cấu hình từng phòng:

```bash
# Phòng 1 - Chia điện
PATCH /api/v1/rooms/1
{
  "electricity_method": "shared",
  "electricity_flat_amount": 0
}

# Phòng 2 - Điện cố định 500k
PATCH /api/v1/rooms/2
{
  "electricity_method": "flat_rate",
  "electricity_flat_amount": 500000
}

# Phòng 3 - Miễn phí điện
PATCH /api/v1/rooms/3
{
  "electricity_method": "free",
  "electricity_flat_amount": 0
}
```

---

### Bước 2: Chốt bill hàng tháng

```bash
# 1. Tạo billing cycle
POST /api/v1/billing/cycles
{
  "month": 7,
  "year": 2026,
  "total_electricity_amount": 1500000  # Chỉ cần nhập tổng tiền!
}

# 2. Nhập số nước (nếu có)
POST /api/v1/billing/cycles/1/readings
{
  "readings": [
    {"room_id": 1, "water_reading": 5},
    {"room_id": 2, "water_reading": 3}
  ]
}

# 3. Tính toán hóa đơn
POST /api/v1/billing/cycles/1/calculate
```

Hệ thống sẽ:
- Tự động đếm phòng shared
- Tự động chia tiền điện
- Tạo hóa đơn cho tất cả phòng

---

### Bước 3: Xóa hóa đơn (nếu cần)

```bash
DELETE /api/v1/billing/invoices/123
```

---

## 📊 Ví Dụ Thực Tế

### Tình huống: 3 phòng, điện 2 triệu

**Cấu hình:**
- Phòng 1: Shared (chia điện)
- Phòng 2: Shared (chia điện)
- Phòng 3: Flat rate 800,000đ

**Chốt bill:**
```json
POST /api/v1/billing/cycles
{
  "month": 7,
  "year": 2026,
  "total_electricity_amount": 2000000
}
```

**Kết quả:**
- Số phòng shared: 2 (Phòng 1 + Phòng 2)
- Phòng 1: 2,000,000 / 2 = 1,000,000đ
- Phòng 2: 2,000,000 / 2 = 1,000,000đ
- Phòng 3: 800,000đ (cố định)

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Migration Database
Cần chạy migrations trước khi sử dụng:
```bash
docker exec motel_database mysql -u motel_user -pmotel_pass_2024 family_motel_db < database/migrate_add_room_electricity_config.sql

docker exec motel_database mysql -u motel_user -pmotel_pass_2024 family_motel_db < database/migrate_update_billing_cycles.sql
```

### 2. Backend đã rebuild
Backend container đã được rebuild với code mới. Không cần rebuild lại.

### 3. Frontend cần cập nhật
Frontend hiện tại vẫn dùng cách cũ. Cần cập nhật:
- **Rooms page**: Thêm UI để cấu hình electricity method
- **Billing page**: Đổi từ nhập KWh sang nhập tổng tiền điện

---

## 🔄 Khác Biệt Trước/Sau

### TRƯỚC (cách cũ):
```
Chốt bill:
1. Nhập tổng KWh: 590
2. Nhập đơn giá: 3,500đ/KWh
3. Nhập số phòng chia: 2
4. Chọn method cho từng phòng trong billing

→ Rườm rà, phức tạp
```

### SAU (cách mới):
```
Cấu hình (một lần):
- Set method cho từng phòng trong Rooms

Chốt bill:
1. Nhập tổng tiền điện: 1,500,000đ
2. Nhập số nước (nếu có)
3. Chốt!

→ Đơn giản, nhanh chóng
```

---

## 📁 Files Đã Thay Đổi

### Backend:
1. `backend/src/routes/billing.js` - Cập nhật API
2. `backend/src/routes/rooms.js` - Thêm electricity config
3. `backend/src/services/billingService.js` - Logic tính toán mới
4. `database/migrate_add_room_electricity_config.sql` - Migration
5. `database/migrate_update_billing_cycles.sql` - Migration

### Frontend (cần cập nhật):
1. `frontend/app/rooms/page.js` - Cần thêm UI config điện
2. `frontend/app/billing/page.js` - Cần đổi từ KWh sang total amount

---

## ✅ Checklist Hoàn Thành

- [x] DELETE invoice endpoint
- [x] Rooms có electricity configuration
- [x] Billing dùng total_electricity_amount
- [x] Tự động đếm shared rooms
- [x] Logic tính toán mới
- [x] Database migrations
- [x] Backend rebuild
- [ ] Frontend rooms page update
- [ ] Frontend billing page update

---

## 🚀 Next Steps

1. **Cập nhật Frontend Rooms Page:**
   - Thêm dropdown chọn electricity method
   - Thêm input cho flat amount (nếu chọn flat_rate)

2. **Cập nhật Frontend Billing Page:**
   - Bỏ input KWh và unit price
   - Chỉ giữ input "Tổng tiền điện"
   - Bỏ input "Số phòng chia" (tự động)

3. **Testing:**
   - Test các scenario khác nhau
   - Verify tính toán đúng
   - Test xóa invoice

---

**Hoàn thành bởi:** Junior Tester  
**Ngày:** 17/07/2026

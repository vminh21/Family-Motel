# 🏠 Family Motel Management (Quản Lý Phòng Trọ Gia Đình)

Hệ thống quản lý phòng trọ tối giản, hiện đại và hiệu quả. Dự án giúp các chủ nhà trọ quản lý danh sách phòng, khách thuê, thiết bị phòng và tự động hóa toàn bộ quy trình tính toán, chốt hóa đơn hàng tháng.

---

## 💡 Ý Tưởng Dự Án (Concept)

Dự án ra đời nhằm giải quyết những khó khăn trong việc quản lý và chốt hóa đơn hàng tháng của các nhà trọ/chung cư mini:
* **Tự động hóa tính toán**: Thay thế việc tính tiền phòng, tiền điện, tiền nước thủ công qua sổ sách hoặc file Excel dễ sai sót.
* **Quy trình chốt hóa đơn 3 bước**: Giúp chủ nhà trọ chốt bill cực kỳ nhanh gọn và chính xác.
* **Chia sẻ tiền điện linh hoạt**: Hỗ trợ tự động chia đều tiền điện tổng cho các phòng sử dụng chung (Shared) hoặc tính theo đơn giá khoán cố định.
* **Thanh toán thông minh**: Tự động tạo mã QR chuyển khoản ngân hàng (VietQR) theo thông tin hóa đơn (số tiền, nội dung chuyển khoản gồm số phòng) giúp khách thuê quét mã thanh toán ngay tức thì.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend**: Next.js 15 (React), Tailwind CSS / Vanilla CSS, Axios.
* **Backend**: Node.js, Express.js, JWT Authentication.
* **Database**: MySQL 8.0 / 8.4.
* **DevOps / Hosting**: Docker, Docker Compose (Local Dev), Vercel (Frontend Hosting), Render (Backend Hosting), Aiven (MySQL Cloud Database).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Installation & Run)

Để khởi chạy toàn bộ dự án dưới môi trường phát triển (Local Development) bằng **Docker Desktop**:

### 1. Chuẩn bị
* Đảm bảo máy tính của bạn đã cài đặt **Docker Desktop** và ứng dụng đang được bật.

### 2. Tải mã nguồn về máy
```bash
git clone https://github.com/vminh21/Family-Motel.git
cd Family-Motel
```

### 3. Khởi chạy hệ thống bằng Docker
Chạy lệnh sau tại thư mục gốc của dự án:
```bash
docker compose up --build -d
```

### 4. Truy cập hệ thống
* **Giao diện Website**: [http://localhost:3001](http://localhost:3001)
* **Tài khoản Admin mặc định**:
  * **Username**: `admin`
  * **Password**: `admin@123`
* **Backend API**: [http://localhost:5001/api/v1](http://localhost:5001/api/v1)

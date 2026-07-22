# 🏠 Family Motel Management (Quản Lý Phòng Trọ Gia Đình)

Hệ thống quản lý phòng trọ gia đình tối giản, hiện đại và hiệu quả. Giúp chủ nhà trọ quản lý danh sách phòng, khách thuê, thiết bị phòng và tự động hóa toàn bộ quy trình tính toán hóa đơn hàng tháng.

---

## ✨ Các Tính Năng Nổi Bật (Key Features)

* **Quản Lý Phòng Trọ**: Theo dõi danh sách phòng trống/đã thuê, thông tin giá thuê cơ bản.
* **Quản Lý Khách Thuê (Tenants)**: Lưu trữ thông tin cá nhân khách thuê, số điện thoại, tiền cọc, số người ở.
* **Quản Lý Thiết Bị (Equipments)**: Ghi nhận và cập nhật tình trạng tài sản, nội thất trong mỗi phòng (tủ quần áo, điều hòa, giường ngủ,...).
* **Chốt Hoá Đơn Hàng Tháng (Monthly Billing)**:
  * Quy trình chốt hóa đơn trực quan 3 bước.
  * Hỗ trợ nhiều cách tính tiền điện (Chia đều theo tổng hóa đơn chung hoặc tính theo khoán/cố định).
  * Hỗ trợ nhiều cách tính tiền nước (Miễn phí hoặc cố định theo phòng).
  * Tự động tạo mã QR thanh toán ngân hàng (VietQR) tương thích với số tiền và nội dung chuyển khoản của từng hóa đơn phòng.
  * In hóa đơn chuyên nghiệp hoặc lưu dưới dạng PDF.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend**: Next.js 15 (React), Tailwind CSS / Vanilla CSS, Axios.
* **Backend**: Node.js, Express.js, JWT Authentication.
* **Database**: MySQL 8.0 / 8.4.
* **DevOps**: Docker, Docker Compose, Vercel, Render, Aiven.

---

## 💻 Hướng Dẫn Chạy Dự Án Ở Máy Local

Để chạy thử nghiệm toàn bộ hệ thống trên máy Mac cá nhân của bạn thông qua **Docker Desktop**:

1. Mở ứng dụng **Docker Desktop**.
2. Chạy lệnh dưới đây ở thư mục gốc dự án:
   ```bash
   docker compose up --build -d
   ```
3. Truy cập hệ thống:
   * **Giao diện Website**: [http://localhost:3001](http://localhost:3001)
   * **Backend API**: [http://localhost:5001/api/v1](http://localhost:5001/api/v1)

---

## 📘 Tài Liệu Nội Bộ
Các thông tin cấu hình chi tiết thư mục và hướng dẫn deploy lên môi trường chạy thực tế (Production) được lưu tại file:
* `DOCUMENTATION.md` (Tài liệu này được lưu cục bộ trên máy của bạn và đã được bỏ qua trong `.gitignore` để đảm bảo bảo mật thông tin máy chủ).

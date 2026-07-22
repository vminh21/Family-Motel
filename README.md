# 🏠 Family Motel Management (Quản Lý Phòng Trọ Gia Đình)

Hệ thống quản lý phòng trọ gia đình tối giản, hiện đại và hiệu quả. Giúp quản lý danh sách phòng, khách thuê, thiết bị phòng và tự động chốt hóa đơn hàng tháng chỉ với 3 bước.

---

## 📂 1. Cấu Trúc Toàn Bộ Thư Mục Dự Án
Dự án được thiết kế theo mô hình tách biệt giữa Frontend (Next.js) và Backend (Node.js/Express) để dễ dàng triển khai độc lập.

```text
Family-Motel/
├── backend/                       # --- MÃ NGUỒN BACKEND API ---
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Cấu hình kết nối MySQL (hỗ trợ SSL cho Cloud DB)
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # Middleware xác thực người dùng bằng JWT
│   │   ├── routes/
│   │   │   ├── auth.js            # API Đăng ký / Đăng nhập
│   │   │   ├── rooms.js           # API Quản lý danh sách phòng
│   │   │   ├── tenants.js         # API Quản lý khách thuê trọ
│   │   │   ├── billing.js         # API Thiết lập kỳ chốt bill & tính toán hóa đơn
│   │   │   ├── equipments.js      # API Quản lý thiết bị trong phòng
│   │   │   └── settings.js        # API Cấu hình thông số (tiền rác, tiền wifi, ngân hàng...)
│   │   ├── services/
│   │   │   └── billingService.js  # Engine cốt lõi tính toán tiền điện/nước/phòng
│   │   └── app.js                 # File khởi chạy server Express
│   ├── Dockerfile                 # Dùng để đóng gói chạy thử ở máy Local
│   ├── package.json               # Các thư viện phụ thuộc của Backend
│   └── .env                       # File cấu hình biến môi trường (Chỉ lưu ở máy Local)
│
├── frontend/                      # --- MÃ NGUỒN FRONTEND WEBSITE ---
│   ├── app/
│   │   ├── billing/               # Giao diện chốt bill hàng tháng (3 bước)
│   │   │   └── invoice/[id]/      # Giao diện hiển thị chi tiết hoá đơn & in PDF
│   │   ├── equipments/            # Giao diện quản lý thiết bị từng phòng
│   │   ├── invoices/              # Giao diện lịch sử hóa đơn
│   │   ├── rooms/                 # Giao diện quản lý phòng trọ
│   │   ├── tenants/               # Giao diện quản lý khách thuê
│   │   ├── settings/              # Giao diện cấu hình giá dịch vụ & tài khoản ngân hàng
│   │   ├── login/ / register/     # Giao diện Đăng nhập / Đăng ký
│   │   └── page.js                # Trang Dashboard tổng hợp thống kê doanh thu
│   ├── components/
│   │   └── Sidebar.jsx            # Menu điều hướng ứng dụng
│   ├── lib/
│   │   └── api.js                 # Cấu hình Axios kết nối API
│   ├── next.config.ts             # Cấu hình Next.js (chứa rewrite chuyển tiếp API tránh lỗi CORS)
│   ├── Dockerfile                 # Dùng để đóng gói chạy thử ở máy Local
│   └── package.json               # Các thư viện phụ thuộc của Frontend
│
├── database/                      # --- CƠ SỞ DỮ LIỆU ---
│   └── init.sql                   # File duy nhất chứa toàn bộ cấu trúc bảng & dữ liệu mẫu
│
├── docker-compose.yml             # File cấu hình chạy toàn bộ hệ thống bằng Docker Desktop
└── .gitignore                     # Cấu hình loại bỏ các file nhạy cảm khi đẩy lên GitHub
```

---

## ⚙️ 2. Luồng Hoạt Động Của Hệ Thống (Architecture Flow)
```text
┌────────────────────────┐              ┌────────────────────────┐              ┌────────────────────────┐
│   Frontend (Next.js)   │              │   Backend (Express)    │              │   Database (MySQL)     │
│   Host: Vercel (Free)  │ ───────────> │  Host: Render (Free)   │ ───────────> │   Host: Aiven (Free)   │
│   (Giao diện người dùng)│  Gọi API     │    (Xử lý logic &      │  Truy vấn    │  (Lưu trữ dữ liệu      │
│                        │              │     tính toán bill)     │  dữ liệu     │   phòng trọ an toàn)   │
└────────────────────────┘              └────────────────────────┘              └────────────────────────┘
```
1. **Frontend** được triển khai trên **Vercel**. Khi trình duyệt gọi API `/api/v1/*`, Next.js sẽ chuyển tiếp (Proxy) yêu cầu đó tới **Backend** trên **Render** thông qua cấu hình `rewrites` trong file `next.config.ts`. Điều này giúp tránh lỗi CORS (bảo mật chặn tên miền khác nguồn).
2. **Backend** nhận yêu cầu, xác thực token **JWT**, tính toán tiền điện/nước/phòng và ghi/đọc dữ liệu từ **MySQL Database** trên **Aiven** qua kết nối an toàn có mã hóa **SSL**.

---

## 💻 3. Hướng Dẫn Chạy Thư Mục Ở Máy Local (Local Development)

Anh có thể chạy thử nghiệm dự án ngay tại máy Mac cá nhân bằng 2 cách:

### Cách A: Chạy nhanh bằng Docker Desktop (Khuyên dùng)
1. Mở phần mềm **Docker Desktop** trên máy Mac của anh lên.
2. Mở Terminal tại thư mục gốc dự án (`Family-Motel`) và chạy lệnh:
   ```bash
   docker compose up --build -d
   ```
3. Sau khi Docker khởi chạy xong:
   * **Website**: Truy cập [http://localhost:3001](http://localhost:3001)
   * **Backend API**: Chạy ở [http://localhost:5001](http://localhost:5001)
   * **Database**: MySQL chạy ở cổng `3307` (Mật khẩu root: `root_secret_2024`).

### Cách B: Chạy thủ công không dùng Docker
1. **Khởi động MySQL**: Đảm bảo máy anh đã cài và đang bật MySQL (cổng 3306).
2. **Khởi chạy Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Khởi chạy Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🚀 4. Hướng Dẫn Triển Khai Lên Môi Trường Thực Tế (Production Deployment)

Đây là quy trình deploy hệ thống chạy ổn định và **hoàn toàn miễn phí** trên đám mây.

### BƯỚC 1: Khởi tạo Cơ sở dữ liệu MySQL trên Aiven (Miễn phí)
1. Truy cập [Aiven.io](https://aiven.io/) và đăng nhập bằng tài khoản Google.
2. Bấm **Create Service** và chọn:
   * **Dịch vụ**: **MySQL** (Bản 8.0 hoặc 8.4).
   * **Vùng (Region)**: **Asia Pacific** (Chọn Singapore để tốc độ tải nhanh nhất).
   * **Gói cước (Plan)**: Chọn gói **Free** (0$ / tháng, 1GB dung lượng).
3. Bấm **Create Service**. Sau khi trạng thái đổi sang màu xanh **Running**, anh copy các thông tin kết nối gồm:
   * **Host**: (Dạng `family-motel-db-....a.aivencloud.com`)
   * **Port**: (Ví dụ `16119`)
   * **User**: `avnadmin`
   * **Password**: (Nhấp vào hình con mắt để hiển thị mật khẩu và copy).
   * **Database**: `defaultdb`

### BƯỚC 2: Khởi tạo bảng dữ liệu trên Aiven (Chỉ chạy 1 lần duy nhất)
Anh mở Terminal máy Mac tại thư mục dự án và chạy lệnh sau để chạy file cấu trúc `init.sql` lên Aiven:
```bash
docker run --rm -e NODE_PATH=/app/backend/node_modules -v "$PWD":/app node:20-alpine node /app/scratch/init_aiven.js
```
*(Nếu file nháp `init_aiven.js` đã bị xóa, anh có thể chạy lệnh mysql client thông thường hoặc TablePlus để nhập file `database/init.sql` vào database `defaultdb` trên Aiven).*

### BƯỚC 3: Triển khai Backend lên Render.com (Miễn phí)
1. Đăng ký tài khoản tại [Render.com](https://render.com/) bằng GitHub.
2. Chọn **New +** ➡️ **Web Service**.
3. Chọn repo GitHub dự án `Family-Motel` của anh.
4. Cấu hình các thông số sau:
   * **Root Directory**: **`backend`**
   * **Runtime**: **`Node`**
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
5. Nhấp vào mục **Environment** ở menu bên trái của Render và thêm các biến môi trường sau:
   * `DB_HOST`: *(Host của Aiven ở Bước 1)*
   * `DB_PORT`: *(Port của Aiven ở Bước 1)*
   * `DB_USER`: `avnadmin`
   * `DB_PASSWORD`: *(Mật khẩu Aiven ở Bước 1)*
   * `DB_NAME`: `defaultdb`
   * `DB_SSL`: `true`
   * `PORT`: `10000`
   * `JWT_SECRET`: `fmm_super_secret_key_change_in_production_2024`
   * `NODE_ENV`: `production`
6. Bấm **Save Changes** để triển khai. Khi hoàn tất, Render sẽ cấp cho anh 1 đường dẫn API có dạng: `https://family-motel.onrender.com`.

### BƯỚC 4: Triển khai Frontend lên Vercel (Miễn phí)
1. Đăng ký tài khoản tại [Vercel.com](https://vercel.com/) bằng GitHub.
2. Chọn **Add New** ➡️ **Project** ➡️ Chọn import repo `Family-Motel` của anh.
3. Cấu hình trước khi deploy:
   * **Root Directory**: Click chọn **Edit** và chọn thư mục **`frontend`**.
   * **Environment Variables**: Thêm 1 biến môi trường:
     * **Name**: `INTERNAL_API_URL`
     * **Value**: Điền link Backend trên Render kèm đuôi `/api/v1` (Ví dụ: `https://family-motel.onrender.com/api/v1`).
4. Bấm **Deploy**. Vercel sẽ build xong và cấp cho anh một trang web hoạt động chính thức!

---

## ⚠️ 5. Các Lưu Ý Vận Hành Quan Trọng
1. **Không chạy lại file `init.sql`**: Sau khi hệ thống đã đi vào hoạt động và có khách thuê thật, tuyệt đối không chạy lại toàn bộ file `init.sql` vì lệnh `DROP TABLE` trong file này sẽ xóa sạch dữ liệu cũ. Nếu muốn sửa cấu trúc bảng, hãy dùng lệnh `ALTER TABLE` thông qua phần mềm TablePlus.
2. **Backup định kỳ**: Nên thỉnh thoảng dùng TablePlus để export dữ liệu từ Aiven về máy làm bản backup dự phòng.
3. **Chế độ ngủ của Render (Free Tier)**: Gói free của Render sẽ tự động đi vào trạng thái "ngủ" nếu không có lượt truy cập nào trong 15 phút. Lần truy cập tiếp theo sẽ mất khoảng 30 giây để server khởi động lại (đây là cơ chế của gói miễn phí, nếu muốn chạy liên tục 24/7 anh có thể nâng cấp gói Starter $7/tháng trên Render).

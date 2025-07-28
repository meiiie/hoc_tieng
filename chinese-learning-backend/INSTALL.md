# Hướng dẫn cài đặt & chạy dự án Chinese Learning Backend

## 1. Yêu cầu hệ thống
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL (nếu không dùng Railway)
- Git

## 2. Clone dự án
```bash
git clone https://github.com/meiiie/hoc_tieng.git
cd hoc_tieng/app/api/chinese-learning-backend
```

## 3. Cài đặt dependencies
```bash
npm install
```

## 4. Cấu hình biến môi trường
- Copy file `.env.example` thành `.env` (hoặc dùng file `.env` mẫu được cung cấp)
- Điền các thông tin:
  - `DATABASE_URL`: Chuỗi kết nối Railway/PostgreSQL
  - `PINATA_GATEWAY_URL`, `PINATA_JWT`, `PINATA_SECRET`: Thông tin Pinata
  - `GEMINI_API_KEY`: API Key của Google Gemini

## 5. Chạy migration (tạo bảng DB)
```bash
npm run typeorm migration:run
```

## 6. Khởi động ứng dụng
```bash
npm run start:dev
```
- Ứng dụng sẽ chạy ở `http://localhost:3000`

## 7. Kiểm tra API
- Có thể dùng Postman/Insomnia để test các endpoint.
- Swagger UI (nếu bật): `http://localhost:3000/api`

## 8. Cấu trúc dự án
- `src/modules/`: Chứa các module chính (user, pronunciation, ...)
- `src/shared/`: Chứa các service/dịch vụ dùng chung
- `src/config/`: Cấu hình hệ thống

## 9. Đóng góp & phát triển
- Mỗi thành viên nhận 1 module riêng biệt để phát triển (theo phân công leader)
- Đảm bảo tuân thủ chuẩn code, đặt tên rõ ràng, viết comment cho các hàm public
- Khi hoàn thành, tạo pull request lên GitHub để review

---

**Mọi thắc mắc vui lòng liên hệ leader dự án hoặc xem thêm tài liệu trong thư mục `docs/` (nếu có).**

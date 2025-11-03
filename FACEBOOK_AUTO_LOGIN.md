# Facebook Auto-Login System

## Overview

This system provides a complete Facebook auto-login solution with proxy management, cookie extraction, and checkpoint handling.

## Features

### 1. Proxy Management
- Add proxies in bulk using format: `host:port:user:pass`
- Batch check proxy validity
- View working/failing proxy status
- Automatic proxy rotation

**UI Location:** Admin Panel → Automation → Quản lý Proxy

### 2. Facebook Auto Login
- Facebook-like login interface
- Automatic proxy selection
- Real-time login progress logging
- Checkpoint detection and handling

**UI Location:** Admin Panel → Automation → Facebook Auto Login

### 3. Checkpoint Handling
- Device approval via mobile notification
- OTP verification support
- Automatic polling for approval status
- User-friendly guidance modals

### 4. Cookie Management
- Automatic cookie extraction after successful login
- Cookie storage and management
- Cookie validity testing
- Copy to clipboard functionality
- Send cookies to Telegram

**UI Location:** Admin Panel → Automation → Quản lý Cookie

### 5. Real-time Logging
- Step-by-step process tracking
- Vietnamese language support with emojis
- Timestamp for each action
- Status indicators (✅ success, ℹ️ info, ⚠️ warning)

## API Endpoints

### Proxy Management

#### Add Proxies
```http
POST /api/proxy/add
Content-Type: application/json

{
  "proxies": [
    "45.76.214.123:8080:user1:pass1",
    "192.168.1.100:3128:user2:pass2"
  ]
}
```

#### Check Proxies
```http
POST /api/proxy/check
Content-Type: application/json

{
  "proxyIds": ["proxy-id-1", "proxy-id-2"]
}
```

#### Get Random Working Proxy
```http
GET /api/proxy/random
```

#### List All Proxies
```http
GET /api/proxy/list
```

#### Delete Proxy
```http
DELETE /api/proxy/:id
```

### Facebook Login

#### Initiate Login
```http
POST /api/facebook/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "proxyId": "optional-proxy-id"
}
```

#### Poll Checkpoint Status
```http
POST /api/facebook/checkpoint/poll
Content-Type: application/json

{
  "accountId": "account-id"
}
```

#### Submit OTP
```http
POST /api/facebook/checkpoint/otp
Content-Type: application/json

{
  "accountId": "account-id",
  "otp": "123456"
}
```

#### Get Login Logs
```http
GET /api/facebook/logs/:accountId
```

### Cookie Management

#### List Cookies
```http
GET /api/cookies/list
```

#### Get Specific Cookie
```http
GET /api/cookies/:id
```

#### Test Cookie Validity
```http
POST /api/cookies/test
Content-Type: application/json

{
  "accountId": "account-id"
}
```

#### Delete Cookie
```http
DELETE /api/cookies/:id
```

### Telegram Integration

#### Send Cookie to Telegram
```http
POST /api/telegram/send
Content-Type: application/json

{
  "accountId": "account-id",
  "chatId": "optional-chat-id"
}
```

#### Configure Telegram
```http
POST /api/telegram/config
Content-Type: application/json

{
  "botToken": "your-bot-token",
  "chatId": "your-chat-id"
}
```

## Database Schema

### proxies
```sql
CREATE TABLE proxies (
  id VARCHAR(36) PRIMARY KEY,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  username VARCHAR(255),
  password VARCHAR(255),
  is_working BOOLEAN DEFAULT false,
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### facebook_accounts
```sql
CREATE TABLE facebook_accounts (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  proxy_id VARCHAR(36),
  cookie_data TEXT,
  last_login TIMESTAMP,
  status ENUM('pending', 'success', 'failed', 'checkpoint', 'otp_required') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE SET NULL
);
```

### login_logs
```sql
CREATE TABLE login_logs (
  id VARCHAR(36) PRIMARY KEY,
  account_id VARCHAR(36),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR(255) NOT NULL,
  status ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  details TEXT,
  FOREIGN KEY (account_id) REFERENCES facebook_accounts(id) ON DELETE CASCADE
);
```

## Usage Example

### 1. Add Proxies
1. Navigate to **Automation → Quản lý Proxy**
2. Paste proxy list in format: `host:port:user:pass`
3. Click "Thêm Proxy"
4. Click "Kiểm tra tất cả" to verify proxies

### 2. Perform Facebook Login
1. Navigate to **Automation → Facebook Auto Login**
2. Enter Facebook email and password
3. Click "Đăng nhập"
4. Watch real-time logs for progress
5. Handle checkpoint if prompted:
   - Approve on mobile device for device approval
   - Enter 6-digit OTP if requested

### 3. Manage Cookies
1. Navigate to **Automation → Quản lý Cookie**
2. View all extracted cookies
3. Actions available:
   - Copy to clipboard
   - Test validity
   - Send to Telegram
   - Delete

## Example Log Output

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
[10:36:13] ✅ 🎉 Hoàn tất! Tất cả dữ liệu đã được lưu
```

## Environment Variables

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Database Configuration (optional for production)
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_USER=bvote_user
DB_PASSWORD=bvote_secure_2025
DB_NAME=bvote_production
```

## Security Considerations

1. **Passwords**: Store passwords encrypted in production
2. **Cookies**: Encrypt cookie data before storage
3. **Proxies**: Use authenticated proxies for better security
4. **Rate Limiting**: Implement rate limiting to avoid detection
5. **Proxy Rotation**: Rotate proxies regularly to avoid bans

## Future Enhancements

- [ ] Integrate real Puppeteer automation for Facebook login
- [ ] Add support for multiple platforms (Instagram, TikTok, etc.)
- [ ] Implement advanced checkpoint handling (2FA, email verification)
- [ ] Add cookie rotation and refresh mechanism
- [ ] Implement proxy health monitoring
- [ ] Add webhook notifications for login events
- [ ] Support for bulk account management
- [ ] Add account scheduling and automation rules

## Testing

Run integration tests:
```bash
cd backend
node test-facebook-api.js
```

Build admin frontend:
```bash
cd admin
npm run build
```

Start backend server:
```bash
cd backend
npm start
```

## Support

For issues or questions, please refer to the main repository documentation or create an issue on GitHub.

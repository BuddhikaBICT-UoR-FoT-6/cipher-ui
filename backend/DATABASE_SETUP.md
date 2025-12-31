# Database Setup Guide

## 🚀 Quick Setup (Recommended)

### 1. Create Database Only
In MySQL Workbench, execute:
```sql
CREATE DATABASE cipher_db;
```

### 2. Update Environment Variables
Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=cipher_db
JWT_SECRET=cipher_secret_key_2024_secure
PORT=3001
```

### 3. Start Backend
```bash
cd backend
npm install
npm start
```

**✅ That's it! All tables will be created automatically.**

---

## 📊 Database Schema Overview

The backend automatically creates these tables:

### **Core Tables:**
- **`users`** - User accounts and authentication
- **`custom_ciphers`** - User-created cipher algorithms
- **`saved_messages`** - Encrypted/decrypted message history

### **Email + Security Tables:**
- **`email_otps`** - OTPs (hashed) for registration, reset, and sensitive actions
- **`email_event_log`** - Cooldowns for OTP resend / security notifications
- **`system_email_settings`** - Admin-configurable email settings (SMTP/Ethereal)

### **Analytics Tables:**
- **`cipher_history`** - Usage tracking and performance metrics
- **`user_stats`** - User activity statistics and achievements

### **Badges:**
- **`user_badges`** - Earned badges per user
- **`badge_assets`** - Badge image metadata served from `/badges/*`

### **Future Feature Tables:**
- **`cipher_challenges`** - Puzzle games and challenges
- **`user_challenge_attempts`** - Challenge completion tracking
- **`shared_ciphers`** - Cipher sharing and collaboration

---

## 🔧 Manual Setup (Optional)

If you prefer to create tables manually:

```sql
-- Create database
CREATE DATABASE cipher_db;
USE cipher_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Custom ciphers table
CREATE TABLE custom_ciphers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mapping JSON NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Additional tables created automatically by backend...
```

---

## 🔍 Verify Setup

### Check Database Connection:
```bash
curl http://localhost:3001/api/health
```

On Windows PowerShell, you can also run:
```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

### Expected Response:
```json
{
  "status": "OK",
  "message": "Cipher API is running",
  "features": [
    "JWT Authentication",
    "Custom Cipher Builder",
    "Message History",
    "User Statistics",
    "Public Cipher Gallery",
    "Cipher Usage Tracking",
    "Admin Dashboard",
    "Cipher Challenges",
    "Saved Messages",
    "Cipher Sharing"
  ]
}
```

### Check Tables Created:
```sql
USE cipher_db;
SHOW TABLES;
```

### Expected Tables:
- users
- custom_ciphers
- email_otps
- email_event_log
- system_email_settings
- cipher_history
- saved_messages
- cipher_challenges
- user_challenge_attempts
- user_stats
- user_badges
- badge_assets
- shared_ciphers

---

## 🛠 Troubleshooting

### Common Issues:

**Connection Error:**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure `cipher_db` database exists

**Permission Error:**
- Grant privileges: `GRANT ALL PRIVILEGES ON cipher_db.* TO 'your_user'@'localhost';`

**Port Conflict:**
- Change PORT in `.env` if 3001 is in use

Tip: This repo contains two backend copies (`backend/` and `cipher-ui/backend/`). Run only one at a time to avoid port conflicts and confusing 404s.

### Reset Database:
```sql
DROP DATABASE cipher_db;
CREATE DATABASE cipher_db;
```
Then restart the backend.

---

## 📈 Future Features Ready

The database schema supports upcoming features:
- **Cipher Challenges** - Puzzle games and competitions
- **User Statistics** - Performance analytics and achievements  
- **Cipher Sharing** - Collaborative cipher creation
- **Public Gallery** - Community cipher library
- **Usage Analytics** - Performance monitoring

All tables are created with proper indexes and foreign keys for optimal performance and data integrity.
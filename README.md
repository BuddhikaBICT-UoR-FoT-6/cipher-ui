# 🔐 CipherProject — Classic Ciphers + Cryptanalysis Challenge

CipherProject is a full‑stack learning and demo application for classic cryptography. It includes a modern React UI and a Node/Express + MySQL API with authentication, user/admin workflows, and an interactive **Cryptanalysis Challenge** mode (20‑step runs, progress resume, scoring, and badges).

## ✨ Key Features

### Cipher tools
- Encrypt/decrypt using **Caesar**, **ROT13**, **Atbash**, **Vigenère**, and **Rail Fence**.
- **Multiple cipher chaining** (restricted to authenticated users).
- **Custom Cipher Builder** with mapping configuration and save functionality.

### Cryptanalysis Challenge (Break ciphers without knowing the key)
- Authenticated users can play a **20‑step run** of cipher challenges.
- Each step ends with a **Challenge Result** screen; the full run ends with a **Run Complete** summary.
- **Resume after logout**: run state persists per user (localStorage).
- **Skip** counts as fail and advances the run.
- **Hinting**: algorithm hints per cipher type + contextual challenge hints.
- **Wrong‑attempt rules**:
	- After 3 wrong attempts → offer **Lower difficulty**.
	- After lowering, 3 more wrong attempts → offer **Reveal answer** (counts as fail).
- Per‑challenge timing is tracked and sent to the backend.

### User profile + badges
- Profile stats (completed challenges, total points).
- Badge milestones (e.g., bronze/silver/gold/diamond) awarded and shown in the UI.
- Badge images are served by the backend and rendered consistently in the UI.

### Auth + administration
- **JWT authentication** (1 hour expiry).
- Account **deactivate** / **delete** flows (OTP protected).
- **Email OTP security flows**:
	- Registration requires an email OTP.
	- Forgot-password reset uses email OTP.
	- Sensitive actions (deactivate/delete) require email OTP.
- Admin dashboard for user management + system email configuration.

### Email delivery
- Admin-configurable email settings stored in the database (SMTP/Ethereal).
- SMTP password is encrypted at rest (AES-256-GCM; key derived from `EMAIL_SETTINGS_ENC_KEY` or `JWT_SECRET`).
- Dev helpers:
	- `EMAIL_PROVIDER=ethereal` for safe local inbox previews (disabled in production).
	- `DEV_PRINT_OTPS=true` to print OTPs to the server console (non-production only).

### UI/UX
- Responsive layout with **light/dark theme**.
- Toast notifications for feedback.

## 🧱 Tech Stack

**Frontend** ([cipher-ui/cipher-ui/](cipher-ui/cipher-ui/))
- React (Create React App)
- Testing Library + Jest
- Fetch API

**Backend** ([backend/](backend/))
- Node.js + Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- CORS + dotenv

**Reference Java implementations** ([src/main/java/](src/main/java/))
- Java versions of classic ciphers (used as reference material / coursework artifacts)

## 🗂️ Repository Layout

```
CipherProject/
	backend/                 # Express API + DB init
	cipher-ui/cipher-ui/     # React UI (Create React App)
	src/main/java/           # Java reference implementations
	Database.sql             # Optional/manual DB setup script
	README.md
```

## ✅ Prerequisites

- Node.js (LTS recommended)
- MySQL Server (local instance)

## 🚀 Running Locally

### 1) Database

Create a database (example):

```sql
CREATE DATABASE cipher_db;
```

The backend can auto-create tables on startup (recommended). You can also use [Database.sql](Database.sql) for manual setup if needed.

More details: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)

### 2) Backend (API)

From the repo root:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=cipher_db
JWT_SECRET=cipher_secret_key_2024_secure
PORT=3001

# Optional (recommended for local dev)
# EMAIL_PROVIDER=ethereal
# DEV_PRINT_OTPS=true
# EMAIL_SETTINGS_ENC_KEY=<any long random string>
```

Start the server:

```bash
npm start
```

The API runs at `http://localhost:3001`.

Note: This repo contains two backend copies: [backend/](backend/) and [cipher-ui/backend/](cipher-ui/backend/).
For development, run **only one** to avoid port conflicts, and make sure the UI is talking to the one you started.

### 3) Frontend (React UI)

In another terminal:

```bash
cd cipher-ui/cipher-ui
npm install
npm start
```

Open `http://localhost:3000`.

## 🔑 Session behavior

- JWT tokens are issued with a **1 hour expiry**.
- The UI auto-logs out when the token expires (including after sleep/background tab scenarios).

## 🧪 Tests

Frontend tests:

```bash
cd cipher-ui/cipher-ui
npm test -- --watchAll=false
```

## 📚 Documentation

The UI contains generated docs under [cipher-ui/cipher-ui/docs/](cipher-ui/cipher-ui/docs/).

Generate docs (optional):

```bash
cd cipher-ui/cipher-ui
npm run docs:all
```

## 🔌 API Overview (selected)

Base URL: `http://localhost:3001`

Auth
- `POST /api/auth/register/request-otp`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password/request-otp`
- `POST /api/auth/reset-password`

Profile / badges
- `GET /api/me/profile`
- Badge images: `GET /badges/*`

Cryptanalysis Challenge
- `GET /api/challenges`
- `POST /api/challenges/attempt`
- `GET /api/challenges/:id/reveal` (only when user chooses “Reveal answer”)
- `POST /api/challenges/generate-easy` (used for “Lower difficulty”)

User lifecycle
- `POST /api/user/deactivate/request-otp`
- `PUT /api/user/deactivate`
- `POST /api/user/delete/request-otp`
- `DELETE /api/user/delete`

Admin
- `GET /api/admin/email-settings`
- `PUT /api/admin/email-settings`
- `POST /api/admin/users`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

## 🛠 Troubleshooting

- **Backend can’t connect to DB**: verify MySQL is running and `backend/.env` credentials match.
- **Port already in use**: change `PORT` in `backend/.env` or stop the conflicting process.
- **Frontend can’t call backend**: ensure backend is running on `http://localhost:3001`.
- **Delete button / actions “do nothing”**: confirm the backend on `3001` is the one you started (avoid running both backend copies).

## 📄 Notes

This project is intended for coursework / learning: it demonstrates classic cipher algorithms, modern web implementation patterns, and basic security/auth flows.
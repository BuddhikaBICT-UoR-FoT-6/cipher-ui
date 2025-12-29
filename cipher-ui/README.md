# Cipher UI (React)

This folder contains the React (Create React App) frontend for CipherProject.

## ✅ Prerequisites

- Node.js (LTS recommended)
- The backend API running at `http://localhost:3001`

## 🚀 Run (Dev)

From the repository root:

```bash
cd cipher-ui/cipher-ui
npm install
npm start
```

Open `http://localhost:3000`.

## 🔌 Backend dependency

Most features require the API on port `3001`:

- Authentication (login/register)
- OTP flows (register, reset password, deactivate/delete)
- Admin dashboard (users + email settings)
- Cipher history, saved messages, challenges, profile/badges

If the UI looks “stuck” or buttons appear to do nothing, confirm the backend is running and that port `3001` is not occupied by an old process.

## ✨ UI behavior highlights

- **OTP-based registration**: click “Send OTP”, then complete registration with the emailed OTP.
- **Forgot password**: request OTP, then reset password.
- **Admin email settings**: admins can configure SMTP or Ethereal directly from the Admin Dashboard.
- **Consistent confirmations**: destructive admin actions (e.g., delete user) use an in-app confirm toast (not a browser confirm dialog).

## 🧪 Tests

```bash
cd cipher-ui/cipher-ui
npm test -- --watchAll=false
```

On Windows/CI you can force non-watch mode with:

```powershell
$env:CI='true'; npx react-scripts test --watchAll=false
```

## 📚 Documentation

Generated UI docs live in `docs/`.

```bash
cd cipher-ui/cipher-ui
npm run docs:all
```

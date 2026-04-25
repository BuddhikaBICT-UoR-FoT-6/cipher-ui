# Hosting Guide: Vercel (Frontend) & Railway (Backend)

This guide explains how to deploy your monorepo structure where the frontend is in `cipher-ui/` and the backend is in `backend/`.

---

## 1. Backend Deployment (Railway)

Railway is excellent for Node.js backends and databases.

### Step A: Connect Repository
1. Log in to [Railway.app](https://railway.app/).
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your repository: `cipher-ui`.

### Step B: Configure Backend Service
1. After importing, Railway might try to deploy the root. You need to point it to the `backend` folder.
2. Go to the **Settings** tab of your service.
3. Find **"Root Directory"** and set it to `/backend`.
4. Railway will automatically detect `npm start` from `backend/package.json`.

### Step C: Add MySQL Database
1. In your Railway project, click **"New"** -> **"Database"** -> **"Add MySQL"**.
2. Railway will automatically inject variables like `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`.
3. **Note:** Your `server.js` is already configured to prioritize these Railway variables!

### Step D: Environment Variables
Go to the **Variables** tab for the backend service and add:
- `JWT_SECRET`: (Generate a random string)
- `EMAIL_SETTINGS_ENC_KEY`: (Generate a random string)
- `EMAIL_PROVIDER`: `smtp` (or `ethereal` for testing)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: (Your email config)
- `PORT`: `3001` (or leave default, Railway handles this)

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for React/Next.js apps.

### Step A: Import Project
1. Log in to [Vercel](https://vercel.com/).
2. Click **"Add New"** -> **"Project"**.
3. Import your GitHub repo: `cipher-ui`.

### Step B: Configure Project Settings
1. **Root Directory**: Click **"Edit"** and select the `cipher-ui` folder.
2. **Framework Preset**: Should automatically detect **Create React App**.
3. **Build Command**: `npm run build` (Default).
4. **Output Directory**: `build` (Default).

### Step C: Environment Variables
Add the following variable to connect to your Railway backend:
- `REACT_APP_API_URL`: `https://your-backend-url.up.railway.app`
  *(You get this URL from the Railway dashboard after the backend deploys).*

---

## 3. Connecting the Two

1. **CORS**: Your backend currently uses `app.use(cors())`, which allows all origins.
2. **API Calls**: Ensure your React frontend uses `process.env.REACT_APP_API_URL` when making requests.

### Deployment Checklist
- [ ] Backend deployed on Railway with MySQL.
- [ ] Backend variables (`JWT_SECRET`, etc.) added.
- [ ] Frontend deployed on Vercel pointing to `/cipher-ui`.
- [ ] Frontend `REACT_APP_API_URL` points to Railway URL.

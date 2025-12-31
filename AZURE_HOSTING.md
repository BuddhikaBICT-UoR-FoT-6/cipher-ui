# Azure Hosting Guide (Azure for Students)

This repo contains:
- Frontend: React app under `cipher-ui/`
- Backend: Node/Express API under `backend/`

Recommended Azure setup:
- Frontend: **Azure Static Web Apps** (SWA)
- Backend: **Azure App Service (Linux) – Node.js**
- Database: **Azure Database for MySQL – Flexible Server**

## 0) Prereqs
- You have Azure for Students credits (you do).
- Your code is pushed to GitHub.

## 1) Create the Database (Azure Database for MySQL)
1. Azure Portal → **Create a resource** → **Azure Database for MySQL flexible server**.
2. Choose:
   - Resource group: e.g. `cipher-rg`
   - Server name: e.g. `cipher-mysql-<unique>`
   - Region: same region you’ll use for App Service
   - Workload: Dev/Test (smallest)
3. Networking:
   - Public access (simplest for demos)
   - Enable **Allow public access from Azure services within Azure** (or add App Service outbound IPs later)
4. Create a database/schema named `cipher_db`.
5. Import schema:
   - Use a MySQL client (Workbench / CLI) and run `Database.sql` (or the backend’s SQL file).

Save these values (you’ll set them as App Service environment variables):
- `DB_HOST` (server FQDN)
- `DB_PORT` (usually `3306`)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME` (`cipher_db`)
- `DB_SSL=true`

## 2) Deploy Backend (Azure App Service)
### Option A (Easiest): Portal “Deployment Center” (auto-creates workflow)
1. Azure Portal → **App Services** → **Create**.
2. Publish: **Code**, Runtime: **Node.js LTS**, OS: **Linux**.
3. Create the app.
4. App Service → **Configuration** → **Application settings**:
   - `NODE_ENV=production`
   - `JWT_SECRET=<long random string>`
   - `EMAIL_SETTINGS_ENC_KEY=<long random string>`
   - `DB_HOST=<from MySQL>`
   - `DB_PORT=3306`
   - `DB_USER=<from MySQL>`
   - `DB_PASSWORD=<from MySQL>`
   - `DB_NAME=cipher_db`
   - `DB_SSL=true`
5. App Service → **Deployment Center** → GitHub → select repo + branch.
6. Set **Build provider** to GitHub Actions.
7. Set path to build from `backend/` (or pick “Node.js” and point it at backend).

After it deploys, you’ll have:
- Backend URL: `https://<app-name>.azurewebsites.net`

### Option B (Template workflow in this repo)
Use [.github/workflows/azure-backend-appservice.yml](.github/workflows/azure-backend-appservice.yml).

## 3) Deploy Frontend (Azure Static Web Apps)
### Recommended: Create SWA via Portal (auto-creates workflow)
1. Azure Portal → **Static Web Apps** → **Create**.
2. Connect to your GitHub repo.
3. Build details:
   - App location: `cipher-ui`
   - Output location: `build`
4. Add an SWA build env var so the UI calls the hosted backend:
   - In GitHub repo → **Settings → Secrets and variables → Actions → Variables**
   - Add variable: `REACT_APP_API_BASE_URL = https://<your-backend-app>.azurewebsites.net`

SWA will deploy to:
- `https://<swa-name>.azurestaticapps.net`

## 4) CORS / Mixed content notes
- Your backend currently allows all origins via `cors()`.
- Ensure frontend always calls HTTPS backend URL.

## 5) Costs
- SWA has a free tier.
- App Service and Azure MySQL will consume your Student credits.
  Use small SKUs and stop/delete resources when not needed.

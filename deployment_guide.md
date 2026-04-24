# 🚀 SpendWise — Free Deployment Guide

Deploy your **Client (React/Vite)** and **Server (Fastify/Node.js + Prisma + PostgreSQL)** separately, completely for free.

---

## 🗺️ Architecture Overview

```
User Browser
    │
    ▼
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  CLIENT (Vercel)            │ ──────▶ │  SERVER (Render)                 │
│  React + Vite + TailwindCSS │  API   │  Fastify + Prisma + JWT          │
│  (Free Tier — Static Site)  │        │  (Free Tier — Web Service)        │
└─────────────────────────────┘        └─────────────────┬────────────────┘
                                                          │
                                                          ▼
                                        ┌──────────────────────────────────┐
                                        │  DATABASE (Neon)                 │
                                        │  PostgreSQL (Serverless)          │
                                        │  (Free Tier — 0.5 GB storage)    │
                                        └──────────────────────────────────┘
```

| Service    | Platform | Free Tier                                      |
|------------|----------|------------------------------------------------|
| **Client** | [Vercel](https://vercel.com) | Unlimited static deploys, custom domain |
| **Server** | [Render](https://render.com) | 750 hrs/month, sleeps after 15 min inactivity |
| **Database** | [Neon](https://neon.tech) | 0.5 GB storage, 1 project                   |

---

## 📋 Prerequisites

- A [GitHub](https://github.com) account (to connect your repo to hosting platforms)
- Your project pushed to a GitHub repository

---

## STEP 1 — Push to GitHub

If you haven't already, push both `client/` and `server/` folders in a single repo:

```bash
# From the root of the project (/expense-tracker)
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

---

## STEP 2 — Set Up Database on Neon (Free PostgreSQL)

1. Go to **[neon.tech](https://neon.tech)** → Sign up with GitHub.
2. Click **"New Project"** → Give it a name (e.g., `spendwise`).
3. Choose a region close to you → Click **Create Project**.
4. Once created, go to **Dashboard → Connection Details**.
5. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   > ⚠️ **Save this** — you'll need it for the server's `DATABASE_URL` env variable.

---

## STEP 3 — Deploy the Server on Render

### 3.1 — Create the Web Service

1. Go to **[render.com](https://render.com)** → Sign up with GitHub.
2. Click **"New +"** → Select **"Web Service"**.
3. Connect your **GitHub repo**.
4. Configure the service:

   | Setting           | Value                          |
   |-------------------|--------------------------------|
   | **Name**          | `spendwise-server`             |
   | **Root Directory**| `server`                       |
   | **Runtime**       | `Node`                         |
   | **Build Command** | `npm install && npx prisma generate` |
   | **Start Command** | `npm start`                    |
   | **Instance Type** | `Free`                         |

### 3.2 — Add Environment Variables

In Render → your service → **"Environment"** tab, add these variables:

| Key              | Value                                         |
|------------------|-----------------------------------------------|
| `DATABASE_URL`   | Your Neon connection string (from Step 2)     |
| `JWT_SECRET`     | A long random string (e.g., `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | `7d`                                          |
| `PORT`           | `3001`                                        |
| `HOST`           | `0.0.0.0`                                     |
| `NODE_ENV`       | `production`                                  |
| `CORS_ORIGIN`    | Your Vercel client URL (e.g., `https://spendwise.vercel.app`) — **add this after Step 4** |

> 💡 To generate a secure JWT secret, run in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3.3 — Run Database Migrations

After the service first deploys, go to the **"Shell"** tab in Render and run:

```bash
npx prisma migrate deploy
```

> This applies all your Prisma migrations to the Neon database.

### 3.4 — Note Your Server URL

After deployment, Render will give you a public URL like:
```
https://spendwise-server.onrender.com
```
**Save this** — you'll need it for the client.

---

## STEP 4 — Deploy the Client on Vercel

### 4.1 — Prepare the Client for Production

Before deploying, update how the client calls the API. In production there's no Vite dev server proxy, so the client must use the full server URL.

Create a file `client/.env.production`:
```env
VITE_API_URL=https://spendwise-server.onrender.com
```

Then, wherever you make API calls in your client code, ensure you're using:
```js
const BASE_URL = import.meta.env.VITE_API_URL || '';
// Example: fetch(`${BASE_URL}/api/auth/login`)
```

> ⚠️ If your client currently relies on Vite's `/api` proxy (which only works locally), you **must** update all `fetch('/api/...')` calls to use `${BASE_URL}/api/...` or configure a rewrite in Vercel.

**Alternative (No code change needed) — Vercel Rewrites:**

Instead of changing code, create `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://spendwise-server.onrender.com/api/:path*"
    }
  ]
}
```

This proxies all `/api/*` requests from your Vercel site to Render — **no code changes needed!**

### 4.2 — Deploy to Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub.
2. Click **"Add New Project"** → Import your GitHub repo.
3. Configure:

   | Setting            | Value            |
   |--------------------|------------------|
   | **Root Directory** | `client`         |
   | **Framework**      | `Vite`           |
   | **Build Command**  | `npm run build`  |
   | **Output Dir**     | `dist`           |

4. Click **Deploy** → Wait for it to finish.
5. Vercel will give you a URL like:
   ```
   https://spendwise.vercel.app
   ```

### 4.3 — Update CORS on Render

Go back to **Render → Environment** and update:

| Key             | Value                              |
|-----------------|-----------------------------------|
| `CORS_ORIGIN`   | `https://spendwise.vercel.app`    |

Then click **"Save Changes"** → Render will redeploy automatically.

---

## STEP 5 — Verify the Deployment

1. Open your Vercel URL in the browser.
2. Try **registering a new account**.
3. Add an expense and check if it persists after a page refresh.
4. Check Render logs (**Logs tab**) if anything fails.

### Common Issues

| Problem | Fix |
|---|---|
| `CORS error` in browser console | Make sure `CORS_ORIGIN` in Render exactly matches your Vercel URL (no trailing slash) |
| `500` on login/register | Check `DATABASE_URL` is correct in Render and migration ran successfully |
| Server "spinning up" takes 30s | Render free tier sleeps after 15 min — first request is slow, normal behaviour |
| PWA not installable | Ensure the site is served over **HTTPS** — both Vercel and Render do this automatically |
| Prisma error: `Table does not exist` | Run `npx prisma migrate deploy` in Render's Shell tab |

---

## 🔄 Re-deploying After Changes

### Client changes
```bash
git add .
git commit -m "your message"
git push origin main
```
Vercel auto-deploys on every push to `main`. ✅

### Server changes
Render also auto-deploys on every push to `main`. ✅

### Schema changes (new Prisma migration)
After pushing, go to Render **Shell** and run:
```bash
npx prisma migrate deploy
```

---

## 🌐 Custom Domain (Optional — Still Free)

### On Vercel
1. Go to **Project → Settings → Domains**.
2. Add your domain (e.g., `spendwise.yourdomain.com`).
3. Follow the DNS instructions.

### On Render
If you want your API on a custom subdomain (e.g., `api.yourdomain.com`):
1. Go to **Service → Settings → Custom Domains**.
2. Add `api.yourdomain.com` and follow the DNS instructions.

---

## 📦 Summary of Free Services Used

| Service | URL | What it hosts |
|---|---|---|
| [Vercel](https://vercel.com) | `spendwise.vercel.app` | React + Vite client (PWA) |
| [Render](https://render.com) | `spendwise-server.onrender.com` | Fastify API server |
| [Neon](https://neon.tech) | (managed, no public URL) | PostgreSQL database |

> ✅ All three have **generous free tiers** and **no credit card required** to get started.

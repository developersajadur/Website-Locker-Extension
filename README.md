# Website Locker

Browser extension + web dashboard to lock distracting websites behind authentication. Stay focused, stay productive.

🔗 **GitHub:** [github.com/developersajadur/Website-Locker-Extension](https://github.com/developersajadur/Website-Locker-Extension)

## Architecture

```
apps/
├── extension/   # Chrome Extension (Manifest V3, React + Vite)
├── web/         # Web Dashboard (React + Vite + Tailwind)
└── server/      # Backend API (Express + Prisma + PostgreSQL)
```

---

## Local Development Setup

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (install: `npm install -g pnpm`)
- **Docker Desktop** (for PostgreSQL) or a local PostgreSQL instance

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts PostgreSQL on port `5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `website_locker_db`

### 2. Set up the server

```bash
cd apps/server

# Copy environment variables
cp .env.example .env

# Install dependencies
pnpm install

# Run database migrations
npx prisma migrate dev

# Start dev server on http://localhost:5000
pnpm dev
```

### 3. Set up the web dashboard

```bash
cd apps/web

# Create .env.local
echo 'VITE_API_URL=http://localhost:5000/api/v1' > .env.local

# Install dependencies
pnpm install

# Start dev server on http://localhost:5173
pnpm dev
```

### 4. Build and load the extension locally

```bash
cd apps/extension

# Install dependencies
pnpm install

# Build the extension (output in dist/)
pnpm build

# For development with watch mode:
pnpm dev
```

#### Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `apps/extension/dist` folder
5. The extension icon appears in your toolbar — click it to sign in

After making changes:
- Run `pnpm build` again (or keep `pnpm dev` running for auto-rebuild)
- Click the refresh icon on the extension card in `chrome://extensions`

---

## Environment Variables

### Server (`apps/server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_ACCESS_SECRET` | Access token signing key (≥32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token signing key (≥32 chars) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |
| `CORS_ORIGIN` | Comma-separated allowed origins | `http://localhost:5173` |

### Web (`apps/web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

---

## Production Deployment

### Server (Vercel)

The server is configured for Vercel via [vercel.json](apps/server/vercel.json). Deploy directly from the `apps/server` directory:

```bash
cd apps/server
npx vercel deploy --prod
```

Set environment variables in the Vercel dashboard (Settings → Environment Variables) matching `.env.example`.

### Web Dashboard (Vercel)

```bash
cd apps/web
npx vercel deploy --prod
```

Set `VITE_API_URL` to your production server URL (e.g., `https://website-locker-server.vercel.app/api/v1`).

### Extension (Chrome Web Store)

1. Update `version` in [manifest.json](apps/extension/public/manifest.json)
2. Build: `cd apps/extension && pnpm build`
3. Zip the `dist/` folder
4. Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Submit for review

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | React 18, Vite 5, Chrome Manifest V3 |
| Dashboard | React 18, Vite 5, Tailwind CSS, React Hook Form, Zod |
| Server | Express 5, Prisma ORM, PostgreSQL, JWT auth, Zod validation |
| Auth | Short-lived access tokens (15min) + rotating refresh tokens (7d) |

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Sign in |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token |
| `GET`  | `/api/v1/auth/profile` | Get user profile |
| `PUT`  | `/api/v1/auth/profile` | Update profile/password |
| `DELETE` | `/api/v1/auth/account` | Delete account |

### Sites
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sites` | List user's locked sites |
| `POST` | `/api/v1/sites` | Add a site to block |
| `PUT` | `/api/v1/sites/:id` | Update a site |
| `DELETE` | `/api/v1/sites/:id` | Remove a site |

---

## License

MIT

# Railway Deployment Guide

This guide walks you through deploying the Satellite Server monorepo to Railway.

## Overview

This application consists of:
- **API Service**: Express backend with PostgreSQL
- **Frontend Service**: React app with TanStack Start (SSR)
- **Database**: PostgreSQL (managed by Railway)

## Prerequisites

1. Railway account ([railway.app](https://railway.app))
2. Cesium Ion access token ([ion.cesium.com](https://ion.cesium.com))
3. Git repository connected to Railway

## Step-by-Step Deployment

### 1. Create Railway Project

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login to Railway
railway login

# Create a new project
railway init
```

Or use the Railway dashboard to create a new project from your GitHub repository.

### 2. Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will provision a database and automatically set `DATABASE_URL`

### 3. Create API Service

1. Click **"+ New" → "Empty Service"**
2. Name it `satellite-api`
3. Connect your GitHub repository
4. Configure the service:
   - **Root Directory**: Leave empty (monorepo root)
   - **Build Command**: `npm run db:generate && npm run build`
   - **Start Command**: `npm run db:migrate:deploy && npm --workspace apps/api start`
   - **Docker Build Target**: `api-runtime` (under Settings → Builder → Target)

#### API Environment Variables

Set these in the Railway dashboard under **Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | (auto-provided) | Link the PostgreSQL service |
| `PORT` | `3000` | Railway auto-provides `$PORT` |
| `CORS_ORIGIN` | `${{satellite-frontend.url}}` | Frontend URL (set after frontend deploy) |
| `UPDATE_INTERVAL_MS` | `1000` | Optional |
| `LIVE_POSITION_REFRESH_ENABLED` | `false` | Keep false for production |
| `OMM_FILE` | `/app/apps/api/data/omm.sample.json` | Default sample data |

#### Health Check

- Path: `/health`
- Timeout: 60 seconds

### 4. Create Frontend Service

1. Click **"+ New" → "Empty Service"**
2. Name it `satellite-frontend`
3. Connect your GitHub repository
4. Configure the service:
   - **Root Directory**: Leave empty (monorepo root)
   - **Docker Build Target**: `frontend-runtime`

#### Frontend Build Arguments

These must be set as **build-time** variables (they're embedded during build):

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `${{satellite-api.url}}` | API service URL |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | `your_token_here` | Get from ion.cesium.com |

To set build arguments in Railway:
1. Go to **Settings → Builder → Build Arguments**
2. Add `VITE_API_URL` and `VITE_CESIUM_ION_ACCESS_TOKEN`

#### Frontend Runtime Variables

| Variable | Value |
|----------|-------|
| `PORT` | `5173` |

### 5. Link Services

In the Railway dashboard:
1. Go to API service → **Settings → Service Variables**
2. Click **"+ Variable Reference"**
3. Link `CORS_ORIGIN` to the frontend service's public URL
4. Go to Frontend service → **Settings → Build Arguments**
5. Link `VITE_API_URL` to the API service's public URL

### 6. Deploy

Railway will automatically deploy when you push to your connected branch (usually `main`).

You can also manually trigger a deploy:
```bash
railway up
```

### 7. Run Database Migrations

The API start command includes `npm run db:migrate:deploy`, which will run migrations on startup.

To run migrations manually:
```bash
railway run npm run db:migrate:deploy
```

## Configuration Files

The following files help Railway understand your deployment:

- `.railway/api.json` - API service configuration
- `.railway/frontend.json` - Frontend service configuration
- `railway.toml` - Alternative configuration format
- `Dockerfile` - Multi-stage build with `api-runtime` and `frontend-runtime` targets

## Circular Dependency Workaround

There's a chicken-and-egg problem:
- API needs frontend URL for CORS
- Frontend needs API URL for build

**Solution:**
1. Deploy both services with placeholder URLs first
2. After deployment, update the variables with actual Railway URLs
3. Redeploy both services

## Custom Domain (Optional)

1. Go to service **Settings → Networking**
2. Click **"Add Custom Domain"**
3. Follow DNS configuration instructions

## Monitoring

- View logs: Click on a service → **Logs** tab
- View metrics: **Metrics** tab (CPU, memory, network)
- Set up alerts: **Settings → Alerts**

## Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Verify `package.json` scripts are correct
- Ensure Docker targets (`api-runtime`, `frontend-runtime`) exist

### Database Connection Issues
- Verify `DATABASE_URL` is set (should be auto-provided)
- Check PostgreSQL service is running
- Verify migrations ran successfully

### CORS Errors
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Include `https://` in the URL
- Check for trailing slashes

### Frontend Can't Connect to API
- Verify `VITE_API_URL` was set **at build time**
- Check API service is running and healthy
- Frontend needs rebuild if API URL changes

### Missing Cesium Tiles
- Verify `VITE_CESIUM_ION_ACCESS_TOKEN` is set
- Check token is valid on ion.cesium.com
- Token must be set at build time (rebuild if changed)

## Scaling

Railway offers:
- **Vertical scaling**: Increase memory/CPU per service
- **Horizontal scaling**: Multiple replicas (Pro plan)
- **Auto-scaling**: Based on usage (Pro plan)

Configure in **Settings → Resources**

## Cost Optimization

- Start with minimal resources
- Monitor usage in **Usage** tab
- Use Railway's $5/month free allowance
- Scale up as needed

## Useful Commands

```bash
# View logs
railway logs

# Run commands in Railway environment
railway run <command>

# Open service in browser
railway open

# Deploy current directory
railway up

# Check service status
railway status

# Connect to database
railway connect postgres
```

## Environment Template

Railway supports sharing environment templates. After setting up, you can export your configuration:

```bash
railway variables export
```

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domains
3. Set up staging environment (separate Railway project)
4. Enable automatic deployments from GitHub
5. Add health check endpoints to your API

## Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

# Backend Deployment Guide

## Prerequisites
- Backend server requires Node.js 18+ and WebSocket support
- Frontend is deployed at: https://verdant-flan-eeb30e.netlify.app

## Quick Deployment Options

### Option 1: Deploy to Render (Recommended - Free Tier)

1. Fork/clone the repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `24points-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `https://verdant-flan-eeb30e.netlify.app`
7. Click "Create Web Service"
8. Copy the deployed URL (e.g., `https://24points-server.onrender.com`)

### Option 2: Deploy to Heroku

1. Install Heroku CLI
2. In the `server` directory:
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://verdant-flan-eeb30e.netlify.app
git subtree push --prefix server heroku main
```

### Option 3: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables in the Railway dashboard
5. Deploy will start automatically

### Option 4: Deploy to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In the `server` directory:
```bash
fly launch
fly secrets set NODE_ENV=production
fly secrets set ALLOWED_ORIGINS=https://verdant-flan-eeb30e.netlify.app
fly deploy
```

## After Deployment

1. **Test the backend**:
   - Visit: `https://your-backend-url/health`
   - Should return: `{"status":"Server is running"}`

2. **Update Netlify Frontend**:
   - Go to Netlify Dashboard
   - Settings → Environment Variables
   - Add: `VITE_SERVER_URL` = `https://your-backend-url`
   - Trigger redeploy

3. **Verify Connection**:
   - Open the frontend
   - Check browser console for "Connected to server" message
   - No CORS errors should appear

## Environment Variables Reference

- `PORT`: Server port (usually auto-assigned by hosting platform)
- `NODE_ENV`: Set to `production`
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs

## Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your Netlify URL
- Check that URL includes `https://` protocol
- Verify no trailing slashes in URLs

### Connection Failed
- Check if backend is running: visit `/health` endpoint
- Ensure `VITE_SERVER_URL` in Netlify is correct
- Check for WebSocket support on hosting platform

### Socket.io Errors
- Some platforms may require additional configuration for WebSockets
- Render, Railway, and Heroku support WebSockets by default
- Check platform-specific WebSocket documentation
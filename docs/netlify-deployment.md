# Netlify Deployment Guide

## Frontend Deployment (Netlify)

The frontend React application is configured for deployment on Netlify.

### Configuration Files

1. **netlify.toml** - Main Netlify configuration
   - Sets build directory to `client/`
   - Sets publish directory to `dist/`
   - Configures SPA redirects
   - Adds security headers

2. **client/public/_redirects** - Fallback redirect rules
   - Ensures all routes redirect to index.html for client-side routing

### Deployment Steps

1. **Connect GitHub Repository**
   - Link your GitHub repository to Netlify
   - Netlify will auto-detect the configuration

2. **Build Settings** (should be auto-configured):
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`

3. **Environment Variables**
   - Add `VITE_SERVER_URL` pointing to your backend server
   - Example: `https://your-backend.herokuapp.com`

### Backend Deployment (Separate)

The backend Node.js/Socket.io server needs to be deployed separately on a platform that supports WebSocket connections:

- **Recommended**: Heroku, Railway, Render, or DigitalOcean App Platform
- **Not Recommended**: Netlify (doesn't support WebSocket servers)

### Common Issues

1. **Page Not Found (404)**
   - Fixed by redirect rules in netlify.toml and _redirects
   - All routes now redirect to index.html for React Router

2. **WebSocket Connection Failed**
   - Ensure backend is deployed and running
   - Update VITE_SERVER_URL environment variable
   - Check CORS settings on backend

3. **Build Failures**
   - Check Node version (should be 18+)
   - Ensure all dependencies are listed in package.json

### Testing Locally

```bash
# Build the frontend
cd client
npm run build

# Preview the build
npm run preview
```

### Production Checklist

- [ ] Backend deployed and accessible
- [ ] VITE_SERVER_URL environment variable set
- [ ] WebSocket connections tested
- [ ] All routes working (no 404s)
- [ ] Game functionality verified
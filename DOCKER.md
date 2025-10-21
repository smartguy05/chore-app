# Docker Deployment Guide

This guide explains how to run the Chore App (frontend + backend) in a single Docker container.

## Quick Start

### Prerequisites
- Docker installed on your system
- Docker Compose (optional, but recommended)

### Using Docker Compose (Recommended)

1. **Copy the environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your configuration:
   ```bash
   # Required: Change the JWT secret
   JWT_SECRET=your-random-secret-key-here

   # Optional: Configure email for magic links
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

3. **Build and start the container**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open your browser to `http://localhost:5000`
   - The backend API is available at `http://localhost:5000/api/*`

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Stop the container**
   ```bash
   docker-compose down
   ```

### Using Docker CLI

If you prefer not to use Docker Compose:

1. **Build the image**
   ```bash
   docker build -t chore-app .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name chore-app \
     -p 5000:5000 \
     -e JWT_SECRET=your-secret-key \
     -v chore-db:/app/server/data \
     chore-app
   ```

3. **Access the application**
   - Open your browser to `http://localhost:5000`

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | production | Node environment |
| `PORT` | No | 5000 | Server port |
| `JWT_SECRET` | **Yes** | - | Secret for JWT tokens (must be changed!) |
| `SMTP_HOST` | No | smtp.gmail.com | SMTP server for emails |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | - | Email address for sending magic links |
| `SMTP_PASS` | No | - | Email password/app password |
| `FRONTEND_URL` | No | http://localhost:5000 | URL where app is hosted |

### Gmail App Password Setup

To use magic link authentication with Gmail:

1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in the `SMTP_PASS` environment variable

## Data Persistence

The SQLite database is stored in a Docker volume to persist data across container restarts.

### Volume Location
- **Docker Compose**: Named volume `chore-db` (managed by Docker)
- **Docker CLI**: Named volume `chore-db`

### Backup Database

```bash
# Create a backup directory
mkdir -p backups

# Copy database from running container
docker cp chore-app:/app/server/data/chore_app.db ./backups/chore_app_$(date +%Y%m%d_%H%M%S).db
```

### Restore Database

```bash
# Copy database to running container
docker cp ./backups/chore_app_backup.db chore-app:/app/server/data/chore_app.db

# Restart container
docker-compose restart
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs chore-app

# Common issues:
# 1. Port 5000 already in use - change PORT environment variable
# 2. Missing JWT_SECRET - set in .env file
```

### Database issues
```bash
# Access container shell
docker exec -it chore-app sh

# Check database file exists
ls -la /app/server/data/

# View database location in logs
docker-compose logs | grep database
```

### Reset everything
```bash
# Stop and remove containers
docker-compose down

# Remove volume (WARNING: This deletes all data!)
docker volume rm chore-app_chore-db

# Rebuild and restart
docker-compose up -d --build
```

## Production Deployment

### Security Checklist
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use a reverse proxy (nginx, Traefik) for HTTPS
- [ ] Configure proper CORS origins in `server/index.js`
- [ ] Set up regular database backups
- [ ] Monitor container logs
- [ ] Update `FRONTEND_URL` to your domain

### Example with nginx reverse proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Compose for Production

```yaml
version: '3.8'

services:
  chore-app:
    build: .
    restart: always
    ports:
      - "127.0.0.1:5000:5000"  # Only expose on localhost
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://yourdomain.com
    volumes:
      - chore-db:/app/server/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  chore-db:
```

## Health Checks

The application includes a health check endpoint:

```bash
# Check if app is running
curl http://localhost:5000/health

# Response:
# {"status":"OK","timestamp":"2025-10-21T12:00:00.000Z"}
```

Docker Compose automatically uses this endpoint for health monitoring.

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild container
docker-compose up -d --build

# View logs to ensure successful restart
docker-compose logs -f
```

## Architecture

The Docker container bundles:
- **Frontend**: React app (built and served as static files)
- **Backend**: Node.js/Express API server
- **Database**: SQLite (persisted in Docker volume)

```
┌─────────────────────────────────────┐
│     Docker Container (port 5000)    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Express Server (Node.js)   │  │
│  │                              │  │
│  │  ├─ API Routes (/api/*)      │  │
│  │  └─ Static Files (React)     │  │
│  └──────────────────────────────┘  │
│              ↓                      │
│  ┌──────────────────────────────┐  │
│  │   SQLite Database            │  │
│  │   (persisted in volume)      │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
           ↓
    Docker Volume
    (chore-db)
```

## Support

For issues or questions:
- Check container logs: `docker-compose logs -f`
- Verify environment variables: `docker exec chore-app env`
- Access container shell: `docker exec -it chore-app sh`

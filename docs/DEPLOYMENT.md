# Tastebase Deployment Guide

Tastebase is designed for local Docker deployment with persistent SQLite storage. This guide covers deployment options for various environments.

## Quick Start (Using Pre-built Image)

The easiest way to deploy Tastebase is using the pre-built Docker image from Docker Hub:

```bash
# Create directory
mkdir tastebase && cd tastebase

# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/reecerose/tastebase/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/reecerose/tastebase/main/.env.docker.example

# Configure
cp .env.docker.example .env
nano .env  # Add your secrets (see below)

# Deploy
docker compose up -d
```

### Using Docker Hub Image

Update `docker-compose.yml` to use the published image:

```yaml
services:
  tastebase:
    image: reecerose/tastebase:latest  # Use Docker Hub image
    # ... rest of config
```

## Building from Source

If you prefer to build from source instead of using the Docker Hub image:

### 1. Clone or Download Repository

```bash
git clone https://github.com/reecerose/tastebase.git
cd tastebase
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.docker.example .env

# Generate secure secrets
node -e "console.log('BETTER_AUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Edit .env with your values
nano .env
```

**Required Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Authentication secret (min 32 chars) | Generate with crypto |
| `BETTER_AUTH_URL` | Your application URL | `http://192.168.1.100:3000` |
| `ENCRYPTION_SECRET` | API key encryption secret (64 chars) | Generate with crypto |
| `CURRENT_ENCRYPTION_VERSION` | Encryption version (default: 1) | `1` |

### 3. Deploy with Docker Compose

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Update to latest
git pull
docker compose up -d --build
```

### 4. Access Your Instance

Open `http://YOUR_SERVER_IP:3000` in your browser and create your first account!

## Deployment Options

### Option 1: Docker Compose (Recommended)

**Advantages:**
- Simple configuration with `docker-compose.yml`
- Easy updates with `git pull && docker compose up -d --build`
- Named volumes for data persistence
- Built-in healthchecks

**Steps:** See Quick Start above

### Option 2: Docker Run

```bash
# Create volumes
docker volume create tastebase-data
docker volume create tastebase-uploads

# Run container
docker run -d \
  --name tastebase \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:/app/data/tastebase.db \
  -e BETTER_AUTH_SECRET="your-secret-here" \
  -e BETTER_AUTH_URL="http://YOUR_IP:3000" \
  -e ENCRYPTION_SECRET="your-encryption-secret-here" \
  -v tastebase-data:/app/data \
  -v tastebase-uploads:/app/uploads \
  tastebase:latest
```

### Option 3: Unraid

See [DEPLOYMENT_UNRAID.md](./DEPLOYMENT_UNRAID.md) for detailed Unraid-specific instructions.

## Data Persistence

Tastebase uses two Docker volumes for persistent storage:

| Volume | Purpose | Contents |
|--------|---------|----------|
| `tastebase-data` | Database | SQLite database file |
| `tastebase-uploads` | User uploads | Recipe images and attachments |

**Backup Your Data:**

```bash
# Backup database and uploads
docker compose down
tar -czf tastebase-backup-$(date +%Y%m%d).tar.gz \
  -C /var/lib/docker/volumes/tastebase-data/_data . \
  -C /var/lib/docker/volumes/tastebase-uploads/_data .
docker compose up -d

# Restore from backup
docker compose down
tar -xzf tastebase-backup-20250107.tar.gz \
  -C /var/lib/docker/volumes/tastebase-data/_data \
  -C /var/lib/docker/volumes/tastebase-uploads/_data
docker compose up -d
```

## Updating Tastebase

### Docker Compose Method

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# View logs to confirm
docker compose logs -f
```

### Docker Run Method

```bash
# Stop and remove old container
docker stop tastebase
docker rm tastebase

# Pull latest code and rebuild
git pull
docker build -t tastebase:latest .

# Start new container (volumes persist)
docker run -d [... same flags as before ...]
```

## Port Configuration

By default, Tastebase runs on port `3000`. To change:

**Docker Compose:**
```yaml
ports:
  - "8080:3000"  # Access via port 8080
```

**Docker Run:**
```bash
-p 8080:3000  # Access via port 8080
```

**Don't forget to update `BETTER_AUTH_URL` accordingly!**

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name recipes.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik (Docker Labels)

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tastebase.rule=Host(`recipes.yourdomain.com`)"
  - "traefik.http.routers.tastebase.entrypoints=websecure"
  - "traefik.http.routers.tastebase.tls.certresolver=letsencrypt"
  - "traefik.http.services.tastebase.loadbalancer.server.port=3000"
```

### Caddy

```caddy
recipes.yourdomain.com {
    reverse_proxy localhost:3000
}
```

## SSL/HTTPS Setup

For production deployments with custom domains, use one of these options:

1. **Reverse Proxy with Let's Encrypt** (Recommended)
   - Use Nginx/Traefik/Caddy with automatic SSL certificates
   - Handles certificate renewal automatically

2. **Cloudflare Tunnel**
   - Zero-config SSL with Cloudflare's free tier
   - No port forwarding required

3. **Self-Signed Certificate**
   - For internal/private networks only

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs tastebase

# Common issues:
# - Missing environment variables
# - Port 3000 already in use
# - Permission issues with volumes
```

### Database migration errors

```bash
# Run migrations manually
docker compose exec tastebase pnpm run db:migrate
```

### Permission issues

```bash
# Fix volume permissions
docker compose down
docker volume rm tastebase-data tastebase-uploads
docker compose up -d
```

### Reset everything

```bash
# WARNING: This deletes all data
docker compose down -v
docker compose up -d
```

## Security Recommendations

1. **Change Default Secrets**: Always generate unique secrets for production
2. **Use HTTPS**: Set up SSL/TLS for public-facing deployments
3. **Firewall Rules**: Restrict access to port 3000 if not using reverse proxy
4. **Regular Backups**: Schedule automated backups of volumes
5. **Update Regularly**: Keep Tastebase updated with latest security patches

## Performance Tuning

### Database Optimization

SQLite is optimized for local deployment. For better-sqlite3 performance:

```bash
# Rebuild better-sqlite3 with optimal flags (done automatically in Dockerfile)
# No action needed - already optimized!
```

### File Upload Limits

Default: 10MB per file. To change:

```yaml
environment:
  - MAX_FILE_SIZE=52428800  # 50MB in bytes
```

## Health Monitoring

Tastebase includes a health check endpoint:

```bash
# Check health
curl http://localhost:3000/api/health

# Response:
# {"status": "ok", "timestamp": "2025-01-07T..."}
```

Docker Compose healthcheck is pre-configured:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Migration from Development

If you've been running Tastebase locally for development:

1. **Export your data:**
   ```bash
   cp data/tastebase.db ~/tastebase-backup.db
   cp -r uploads ~/tastebase-uploads-backup
   ```

2. **Deploy with Docker**

3. **Import your data:**
   ```bash
   docker compose down
   docker cp ~/tastebase-backup.db tastebase:/app/data/tastebase.db
   docker cp ~/tastebase-uploads-backup/. tastebase:/app/uploads/
   docker compose up -d
   ```

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/reecerose/tastebase/issues)
- **Documentation**: [docs/](./docs/)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## License

See [LICENSE](../LICENSE) file for details.

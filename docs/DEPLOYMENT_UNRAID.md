# Deploying Tastebase on Unraid

This guide provides step-by-step instructions for deploying Tastebase on your Unraid server using Docker.

## Prerequisites

- Unraid 6.9+ with Docker support enabled
- Basic familiarity with Unraid's Docker management
- Access to Unraid web interface
- Terminal/SSH access to Unraid (for secret generation)

## Deployment Method 1: Docker Compose (Recommended)

This method uses Docker Compose with the pre-built Docker Hub image for easier management and updates.

### Step 1: Enable Docker Compose on Unraid

1. Install **Compose Manager** plugin from Community Applications
2. Or enable User Scripts plugin and create a compose script

### Step 2: Create Deployment Directory

SSH into your Unraid server:

```bash
# Create directory for Tastebase
mkdir -p /mnt/user/appdata/tastebase
cd /mnt/user/appdata/tastebase

# Download docker-compose.yml and env template
curl -O https://raw.githubusercontent.com/reecerose/tastebase/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/reecerose/tastebase/main/.env.docker.example

# Update docker-compose.yml to use Docker Hub image
nano docker-compose.yml
# Change: build: .
# To: image: reecerose/tastebase:latest
```

**Or clone the full repository if you prefer to build from source:**

```bash
git clone https://github.com/reecerose/tastebase.git .
```

### Step 3: Generate Secrets

```bash
# Generate authentication secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption secret (must be different!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save these secrets!** You'll need them in the next step.

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.docker.example .env

# Edit with your values
nano .env
```

Update these values in `.env`:

```bash
BETTER_AUTH_SECRET=your-generated-secret-from-step-3
BETTER_AUTH_URL=http://YOUR_UNRAID_IP:3000
ENCRYPTION_SECRET=your-generated-encryption-secret-from-step-3
CURRENT_ENCRYPTION_VERSION=1
```

**Important**: Replace `YOUR_UNRAID_IP` with your Unraid server's IP address (e.g., `http://192.168.1.100:3000`)

### Step 5: Deploy

```bash
# Start Tastebase
docker compose up -d

# Check logs
docker compose logs -f tastebase

# Verify it's running
curl http://localhost:3000/api/health
```

### Step 6: Access Tastebase

1. Open browser to `http://YOUR_UNRAID_IP:3000`
2. Create your first account
3. Start adding recipes!

## Deployment Method 2: Unraid Docker Template

This method uses Unraid's native Docker container management.

### Step 1: Prepare Docker Image

SSH into Unraid:

```bash
# Create build directory
mkdir -p /mnt/user/appdata/tastebase-build
cd /mnt/user/appdata/tastebase-build

# Clone repository
git clone https://github.com/reecerose/tastebase.git .

# Build Docker image
docker build -t tastebase:latest .

# Verify image
docker images | grep tastebase
```

### Step 2: Create Container in Unraid Web UI

1. Go to **Docker** tab in Unraid
2. Click **Add Container** at the bottom
3. Fill in the template:

**Basic Configuration:**

| Field | Value |
|-------|-------|
| Name | `tastebase` |
| Repository | `tastebase:latest` |
| Network Type | `bridge` |
| Console shell command | `bash` |

**Port Configuration:**

| Container Port | Host Port | Type |
|---------------|-----------|------|
| 3000 | 3000 | TCP |

**Path Configuration:**

| Container Path | Host Path | Mode |
|---------------|-----------|------|
| `/app/data` | `/mnt/user/appdata/tastebase/data` | Read/Write |
| `/app/uploads` | `/mnt/user/appdata/tastebase/uploads` | Read/Write |

**Environment Variables:**

Click **Add another Path, Port, Variable, Label or Device** for each:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/app/data/tastebase.db` |
| `BETTER_AUTH_SECRET` | Your generated secret |
| `BETTER_AUTH_URL` | `http://YOUR_UNRAID_IP:3000` |
| `ENCRYPTION_SECRET` | Your generated encryption secret |
| `CURRENT_ENCRYPTION_VERSION` | `1` |

### Step 3: Apply and Start

1. Click **Apply**
2. Wait for container to start
3. Check logs in Docker tab
4. Access via `http://YOUR_UNRAID_IP:3000`

## Port Configuration

### Changing Default Port

If port 3000 is already in use:

**Docker Compose:**
```yaml
# Edit docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

**Docker Template:**
- Change Host Port from `3000` to `8080`

**Don't forget to update `BETTER_AUTH_URL`:**
```bash
BETTER_AUTH_URL=http://YOUR_UNRAID_IP:8080
```

## Data Management

### Backup Your Data

**Method 1: Unraid CA Backup Plugin**

1. Install **CA Backup / Restore Appdata** from Community Applications
2. Add `/mnt/user/appdata/tastebase` to backup list
3. Configure automatic backups

**Method 2: Manual Backup**

```bash
# Stop container first
docker stop tastebase

# Backup data
tar -czf /mnt/user/backups/tastebase-backup-$(date +%Y%m%d).tar.gz \
  -C /mnt/user/appdata/tastebase data uploads

# Restart container
docker start tastebase
```

### Restore from Backup

```bash
# Stop container
docker stop tastebase

# Extract backup
tar -xzf /mnt/user/backups/tastebase-backup-20250107.tar.gz \
  -C /mnt/user/appdata/tastebase

# Fix permissions if needed
chown -R 1001:1001 /mnt/user/appdata/tastebase/data
chown -R 1001:1001 /mnt/user/appdata/tastebase/uploads

# Start container
docker start tastebase
```

## Updating Tastebase

### Docker Compose Method

```bash
cd /mnt/user/appdata/tastebase

# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f
```

### Docker Template Method

```bash
cd /mnt/user/appdata/tastebase-build

# Pull latest code
git pull

# Rebuild image
docker build -t tastebase:latest .

# In Unraid web UI:
# 1. Go to Docker tab
# 2. Click tastebase container
# 3. Click "Force Update"
# 4. Container will restart with new image
```

## Reverse Proxy with Nginx Proxy Manager

If you're using Nginx Proxy Manager on Unraid:

### Step 1: Add Proxy Host

1. Open Nginx Proxy Manager web UI
2. Go to **Hosts** → **Proxy Hosts**
3. Click **Add Proxy Host**

### Step 2: Configure Host

**Details Tab:**
- **Domain Names**: `recipes.yourdomain.com`
- **Scheme**: `http`
- **Forward Hostname/IP**: Your Unraid IP or `tastebase` (if using Docker network)
- **Forward Port**: `3000`
- **Cache Assets**: ✅
- **Block Common Exploits**: ✅
- **Websockets Support**: ✅

**SSL Tab:**
- **SSL Certificate**: Select or create Let's Encrypt certificate
- **Force SSL**: ✅
- **HTTP/2 Support**: ✅

### Step 3: Update Environment

Update `BETTER_AUTH_URL` in your `.env` or container environment:

```bash
BETTER_AUTH_URL=https://recipes.yourdomain.com
```

Restart container for changes to take effect.

## Swag Reverse Proxy Setup

If using Swag (Secure Web Application Gateway):

### Step 1: Create Proxy Config

```bash
# Create subdomain config
nano /mnt/user/appdata/swag/nginx/proxy-confs/tastebase.subdomain.conf
```

### Step 2: Add Configuration

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name recipes.*;

    include /config/nginx/ssl.conf;

    client_max_body_size 50M;

    location / {
        include /config/nginx/proxy.conf;
        resolver 127.0.0.11 valid=30s;
        set $upstream_app tastebase;
        set $upstream_port 3000;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;
    }
}
```

### Step 3: Restart Swag

```bash
docker restart swag
```

### Step 4: Update Environment

```bash
BETTER_AUTH_URL=https://recipes.yourdomain.com
```

## Traefik Integration

If using Traefik as your reverse proxy:

### Docker Compose with Traefik Labels

```yaml
services:
  tastebase:
    # ... existing configuration ...
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tastebase.rule=Host(`recipes.yourdomain.com`)"
      - "traefik.http.routers.tastebase.entrypoints=websecure"
      - "traefik.http.routers.tastebase.tls.certresolver=letsencrypt"
      - "traefik.http.services.tastebase.loadbalancer.server.port=3000"

networks:
  traefik:
    external: true
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs tastebase
```

**Common issues:**
1. **Port conflict**: Change host port if 3000 is in use
2. **Missing environment variables**: Verify all required vars are set
3. **Permission issues**: Check appdata folder permissions

**Fix permissions:**
```bash
chown -R 1001:1001 /mnt/user/appdata/tastebase/data
chown -R 1001:1001 /mnt/user/appdata/tastebase/uploads
```

### Database Errors

**Run migrations manually:**
```bash
docker exec -it tastebase pnpm run db:migrate
```

**Reset database (WARNING: deletes all data):**
```bash
docker stop tastebase
rm /mnt/user/appdata/tastebase/data/tastebase.db
docker start tastebase
```

### Upload Failures

**Check upload directory permissions:**
```bash
docker exec -it tastebase ls -la /app/uploads
```

**Fix if needed:**
```bash
docker exec -it tastebase chown -R nextjs:nodejs /app/uploads
```

### Can't Access Web Interface

**Verify container is running:**
```bash
docker ps | grep tastebase
```

**Check network connectivity:**
```bash
curl http://YOUR_UNRAID_IP:3000/api/health
```

**Check firewall rules:**
- Ensure port 3000 (or your custom port) is not blocked
- Check Unraid firewall settings if enabled

### Performance Issues

**Check resource usage:**
```bash
docker stats tastebase
```

**Optimize SQLite:**
```bash
# Already optimized in Dockerfile, but you can rebuild better-sqlite3:
docker exec -it tastebase sh -c \
  "cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release"
```

## Best Practices

### Security

1. **Use unique secrets**: Generate different secrets for each installation
2. **Regular backups**: Enable automatic backups with CA Backup plugin
3. **Reverse proxy with SSL**: Use Nginx Proxy Manager/Swag for HTTPS
4. **Update regularly**: Keep Tastebase updated with latest security patches
5. **Network isolation**: Consider using a separate Docker network

### Performance

1. **Use SSD cache**: Store appdata on SSD cache for better SQLite performance
2. **Regular maintenance**: Vacuum SQLite database periodically
3. **Monitor logs**: Check container logs for warnings or errors
4. **Resource limits**: Set CPU/memory limits if needed in Docker settings

### Maintenance

1. **Monitor disk usage**: Check appdata and uploads folder sizes
2. **Review logs regularly**: Look for errors or warnings
3. **Test backups**: Verify backup integrity periodically
4. **Update strategy**: Keep container updated but test in development first

## Unraid Community Support

- **Unraid Forums**: Post in Docker Containers section
- **Community Applications**: Add custom template for easier installation
- **Discord**: Join Unraid Discord for real-time help

## Next Steps

After successful deployment:

1. ✅ Create your admin account
2. ✅ Configure recipe categories
3. ✅ Start adding recipes!
4. ✅ Invite other users to your instance
5. ✅ Set up reverse proxy for external access (optional)
6. ✅ Configure automated backups

## Support

- **GitHub Issues**: [Report issues](https://github.com/reecerose/tastebase/issues)
- **Documentation**: [Main deployment guide](./DEPLOYMENT.md)
- **Unraid Forums**: Search or post in Docker Containers section

# Tastebase Deployment Guide

Tastebase runs as a single Docker container with a SQLite database and a folder of photos. This guide covers installing it, keeping it up to date, backups, and putting it behind a reverse proxy.

## The image

| Item | Value |
| --- | --- |
| **Image** | `ghcr.io/reecerose/tastebase` |
| **Tags** | `latest` (newest release) and one per release, e.g. `0.1.0` |
| **Architectures** | `linux/amd64`, `linux/arm64` |
| **Port** | `3000` |
| **Health check** | `GET /api/health` (no sign-in needed) |
| **Runs as** | uid/gid `1001` (`nextjs`) |

### Volumes

| Container path | Holds |
| --- | --- |
| `/app/data` | The SQLite database (`DATABASE_URL=file:/app/data/tastebase.db`) |
| `/app/uploads` | Recipe photos |

Mount both. Without them, every recipe and photo is lost when the container is recreated.

### Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `file:/app/data/tastebase.db` |
| `BETTER_AUTH_SECRET` | Yes | output of `openssl rand -base64 48` |
| `BETTER_AUTH_URL` | Yes | `http://192.168.1.100:3000` or `https://recipes.example.com` |
| `ENCRYPTION_SECRET` | Yes | a second, different `openssl rand -base64 48` |
| `CURRENT_ENCRYPTION_VERSION` | No | `1` |

`BETTER_AUTH_URL` must match the address in people's browsers, including the port, or sign-in won't work. Full reference: [environment-variables.md](./environment-variables.md).

## Option 1: Docker Compose (recommended)

```bash
mkdir tastebase && cd tastebase
curl -O https://raw.githubusercontent.com/ReeceRose/tastebase/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/ReeceRose/tastebase/main/.env.docker.example
```

Edit `.env`: generate `BETTER_AUTH_SECRET` and `ENCRYPTION_SECRET` with `openssl rand -base64 48` (one each), and set `BETTER_AUTH_URL`. Then:

```bash
docker compose up -d
docker compose logs -f   # watch the first start; Ctrl+C to stop watching
```

Open your `BETTER_AUTH_URL` and create the first account.

## Option 2: docker run

```bash
docker volume create tastebase-data
docker volume create tastebase-uploads

docker run -d \
  --name tastebase \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL=file:/app/data/tastebase.db \
  -e BETTER_AUTH_SECRET="<openssl rand -base64 48>" \
  -e BETTER_AUTH_URL="http://YOUR_IP:3000" \
  -e ENCRYPTION_SECRET="<a different openssl rand -base64 48>" \
  -v tastebase-data:/app/data \
  -v tastebase-uploads:/app/uploads \
  ghcr.io/reecerose/tastebase:latest
```

## Option 3: Unraid

See [DEPLOYMENT_UNRAID.md](./DEPLOYMENT_UNRAID.md).

## Using host folders instead of named volumes

On a NAS you may want the data in a folder you can see and back up, such as `/srv/tastebase`. The container runs as uid `1001`, so it needs to own those folders:

```bash
mkdir -p /srv/tastebase/data /srv/tastebase/uploads
sudo chown -R 1001:1001 /srv/tastebase
```

```yaml
volumes:
  - /srv/tastebase/data:/app/data
  - /srv/tastebase/uploads:/app/uploads
```

If the folders aren't writable by `1001`, the container exits on start with a SQLite "unable to open database file" error.

## Updating

Releases are listed in [CHANGELOG.md](../CHANGELOG.md) and on the [Releases page](https://github.com/ReeceRose/tastebase/releases). Database migrations run automatically when the new container starts.

**Docker Compose:**

```bash
docker compose pull
docker compose up -d
```

**docker run:**

```bash
docker pull ghcr.io/reecerose/tastebase:latest
docker stop tastebase && docker rm tastebase
docker run -d ...   # same flags as before; the volumes keep your data
```

To upgrade on your own schedule, pin a version (`ghcr.io/reecerose/tastebase:0.1.0`) instead of `latest`, and change it when you're ready. Back up before upgrading.

### Building from source

To run unreleased code, build the image yourself. In `docker-compose.yml`, replace the `image:` line with `build: .`, then:

```bash
git clone https://github.com/ReeceRose/tastebase.git
cd tastebase
cp .env.docker.example .env   # fill it in
docker compose up -d --build
```

## Backups

Everything lives in the two volumes. These commands stop Tastebase so the database is consistent, then write one archive of both volumes to the current folder. They use the container name `tastebase` from the Compose file.

```bash
# Back up
docker compose stop
docker run --rm --volumes-from tastebase -v "$PWD":/backup alpine \
  tar czf /backup/tastebase-$(date +%Y%m%d).tar.gz -C /app data uploads
docker compose start

# Restore (replaces current data)
docker compose stop
docker run --rm --volumes-from tastebase -v "$PWD":/backup alpine \
  sh -c "cd /app && tar xzf /backup/tastebase-20261017.tar.gz"
docker compose start
```

If you use host folders, back those folders up directly while the container is stopped.

### Moving from a development install

```bash
docker compose up -d && docker compose stop   # create the container and volumes
docker cp ./tastebase.db tastebase:/app/data/tastebase.db
docker cp ./uploads/. tastebase:/app/uploads/
docker run --rm --volumes-from tastebase alpine chown -R 1001:1001 /app/data /app/uploads
docker compose start
```

## Changing the port

```yaml
ports:
  - "8080:3000"   # reach Tastebase on port 8080
```

Update `BETTER_AUTH_URL` to match.

## Reverse proxy and HTTPS

Put Tastebase behind a reverse proxy to serve it on a domain with HTTPS, then set `BETTER_AUTH_URL` to the `https://` address.

### Caddy

```caddy
recipes.example.com {
    reverse_proxy localhost:3000
}
```

### Nginx

```nginx
server {
    listen 80;
    server_name recipes.example.com;
    client_max_body_size 10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`client_max_body_size` matters: photo uploads go up to 10 MB, and Nginx rejects anything over 1 MB by default.

### Traefik (Docker labels)

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tastebase.rule=Host(`recipes.example.com`)"
  - "traefik.http.routers.tastebase.entrypoints=websecure"
  - "traefik.http.routers.tastebase.tls.certresolver=letsencrypt"
  - "traefik.http.services.tastebase.loadbalancer.server.port=3000"
```

A Cloudflare Tunnel also works, and doesn't need any open ports.

## Health check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"...","services":{"database":"connected","server":"running"}}
```

It returns `503` if the database can't be reached. The Compose file already uses it for the container health check.

## Troubleshooting

**The container keeps restarting.** Run `docker compose logs tastebase`. The usual causes:

- **"Invalid environment variables"**: the log names the variable. It's usually `ENCRYPTION_SECRET`. Regenerate it with `openssl rand -base64 48`, which has the mix of characters it requires.
- **"unable to open database file"**: the data folder isn't writable by uid `1001`. See [Using host folders](#using-host-folders-instead-of-named-volumes).
- **Port already in use**: change the host side of `ports:`.

**Sign-in loops back to the sign-in page.** `BETTER_AUTH_URL` doesn't match the address in the browser (check the scheme, host and port).

**Migration errors on start.** Migrations run automatically and the container won't start if one fails. Restore your last backup and [open an issue](https://github.com/ReeceRose/tastebase/issues) with the log.

**Start completely fresh.** This deletes every recipe, account and photo:

```bash
docker compose down -v
docker compose up -d
```

More: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Security checklist

1. Generate unique secrets; never reuse the examples.
2. Use HTTPS for anything reachable from outside your home network.
3. If you're not using a reverse proxy, don't expose port 3000 to the internet.
4. Schedule backups.
5. Keep up with releases.

## Support

- **Issues**: [GitHub Issues](https://github.com/ReeceRose/tastebase/issues)
- **Releases**: [GitHub Releases](https://github.com/ReeceRose/tastebase/releases)

## License

MIT. See [LICENSE](../LICENSE).

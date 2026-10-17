# Deploying Tastebase on Unraid

Tastebase runs on Unraid from the published image, `ghcr.io/reecerose/tastebase`. Nothing needs to be built on the server.

## Before you start

- Unraid 6.9 or newer with Docker enabled
- A terminal on the server (**Terminal** icon in the web UI, or SSH)

### Create the appdata folders

The container runs as uid `1001`, not Unraid's usual `nobody` (99:100), so it needs to own its folders:

```bash
mkdir -p /mnt/user/appdata/tastebase/data /mnt/user/appdata/tastebase/uploads
chown -R 1001:1001 /mnt/user/appdata/tastebase/data /mnt/user/appdata/tastebase/uploads
```

If you skip this, the container exits on start with "unable to open database file".

### Generate two secrets

```bash
openssl rand -base64 48   # BETTER_AUTH_SECRET
openssl rand -base64 48   # ENCRYPTION_SECRET (must be different)
```

## Method 1: Docker tab (no plugins)

1. Go to **Docker** and click **Add Container**.
2. Fill in:

   | Field | Value |
   | --- | --- |
   | Name | `tastebase` |
   | Repository | `ghcr.io/reecerose/tastebase:latest` |
   | Network Type | `bridge` |
   | WebUI | `http://[IP]:[PORT:3000]` |

3. Add a **Port**: container `3000` → host `3000` (TCP).
4. Add two **Paths**, both Read/Write:

   | Container path | Host path |
   | --- | --- |
   | `/app/data` | `/mnt/user/appdata/tastebase/data` |
   | `/app/uploads` | `/mnt/user/appdata/tastebase/uploads` |

5. Add these **Variables**:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | `file:/app/data/tastebase.db` |
   | `BETTER_AUTH_SECRET` | your first secret |
   | `BETTER_AUTH_URL` | `http://YOUR_UNRAID_IP:3000` |
   | `ENCRYPTION_SECRET` | your second secret |

6. Click **Apply**, check the container's log, then open `http://YOUR_UNRAID_IP:3000` and create the first account.

**Updating:** click **Check for Updates** on the Docker tab, then **Apply Update** on Tastebase.

## Method 2: Compose Manager

Install the **Compose Manager** plugin from Community Applications, then:

```bash
cd /mnt/user/appdata/tastebase
curl -O https://raw.githubusercontent.com/ReeceRose/tastebase/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/ReeceRose/tastebase/main/.env.docker.example
nano .env   # paste both secrets; set BETTER_AUTH_URL=http://YOUR_UNRAID_IP:3000
```

In `docker-compose.yml`, swap the named volumes for the appdata folders:

```yaml
    volumes:
      - /mnt/user/appdata/tastebase/data:/app/data
      - /mnt/user/appdata/tastebase/uploads:/app/uploads
```

(You can also delete the `volumes:` block at the bottom of the file.)

```bash
docker compose up -d
docker compose logs -f tastebase
```

**Updating:**

```bash
cd /mnt/user/appdata/tastebase
docker compose pull
docker compose up -d
```

## Versions

`latest` is the newest release. To upgrade on your own schedule, use a version tag such as `ghcr.io/reecerose/tastebase:0.1.0` and change it when you're ready. Release notes: [CHANGELOG.md](../CHANGELOG.md).

## Changing the port

Change the host port (for example `8080` → container `3000`) and set `BETTER_AUTH_URL` to `http://YOUR_UNRAID_IP:8080`.

## Backups

Everything is in `/mnt/user/appdata/tastebase`. Stop the container first so the database is consistent:

```bash
docker stop tastebase
tar -czf /mnt/user/backups/tastebase-$(date +%Y%m%d).tar.gz -C /mnt/user/appdata tastebase
docker start tastebase
```

To restore, stop the container, extract the archive back into `/mnt/user/appdata`, and run the `chown` command from [Create the appdata folders](#create-the-appdata-folders) again. The **Appdata Backup** plugin also works if you have it set to stop containers.

## Reverse proxy

Set `BETTER_AUTH_URL` to the `https://` address afterwards and restart the container.

### Nginx Proxy Manager

Add a proxy host:

- **Domain Names**: `recipes.example.com`
- **Scheme**: `http`; **Forward Hostname/IP**: your Unraid IP (or `tastebase` on a shared Docker network); **Forward Port**: `3000`
- **Block Common Exploits**: on
- **SSL**: request a Let's Encrypt certificate and turn on **Force SSL**

Photo uploads are up to 10 MB. If uploads fail through the proxy, add `client_max_body_size 10m;` under **Advanced**.

### SWAG

Create `/mnt/user/appdata/swag/nginx/proxy-confs/tastebase.subdomain.conf`:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name recipes.*;

    include /config/nginx/ssl.conf;

    client_max_body_size 10m;

    location / {
        include /config/nginx/proxy.conf;
        include /config/nginx/resolver.conf;
        set $upstream_app tastebase;
        set $upstream_port 3000;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;
    }
}
```

SWAG and Tastebase must be on the same custom Docker network. Then run `docker restart swag`.

## Troubleshooting

**Container stops right after starting.** Open its log:

- **"unable to open database file"**: the appdata folders aren't owned by `1001`. Run the `chown` command from [Create the appdata folders](#create-the-appdata-folders).
- **"Invalid environment variables"**: the log names the variable. Regenerate secrets with `openssl rand -base64 48`.

**Photo uploads fail.** The uploads folder isn't writable. Run the same `chown` command.

**Sign-in loops back to the sign-in page.** `BETTER_AUTH_URL` doesn't exactly match the address in your browser.

**Can't reach the web UI.** Check the port mapping and that nothing else uses port 3000. `curl http://localhost:3000/api/health` from the Unraid terminal should return `{"status":"ok",...}`.

More: [DEPLOYMENT.md](./DEPLOYMENT.md) and [TROUBLESHOOTING.md](./TROUBLESHOOTING.md). Report problems on [GitHub Issues](https://github.com/ReeceRose/tastebase/issues).

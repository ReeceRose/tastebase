# Environment variables

Tastebase reads its configuration from environment variables, validated at start-up by `src/lib/config/env.ts`. If a required variable is missing or invalid, the server refuses to start and says which one.

Copy `.env.example` to `.env.local` for development. In Docker, set them in `docker-compose.yml` or an `.env` file next to it.

## Required

| Variable | What it does | Example |
| --- | --- | --- |
| `DATABASE_URL` | Path to the SQLite file. A `file:` prefix is optional. | `tastebase.db` (dev), `file:/app/data/tastebase.db` (Docker) |
| `BETTER_AUTH_SECRET` | Signs sessions. Use a long random value and never reuse it. | 64 random hex characters |
| `BETTER_AUTH_URL` | The address people use to reach Tastebase. Sign-in redirects and cookies depend on it. | `http://localhost:3000`, `http://192.168.1.100:3000`, `https://recipes.example.com` |
| `ENCRYPTION_SECRET` | Encrypts the AI provider keys people add in Settings. At least 32 characters with good variety (upper and lower case, numbers, symbols). Must differ from `BETTER_AUTH_SECRET`. | see below |

## Optional

| Variable | Default | What it does |
| --- | --- | --- |
| `CURRENT_ENCRYPTION_VERSION` | `1` | Bump when rotating `ENCRYPTION_SECRET`; see [security/key-rotation.md](./security/key-rotation.md). |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Default Ollama address when someone adds Ollama in Settings without a host. |
| `BETTER_AUTH_TELEMETRY` | `0` | BetterAuth telemetry. Leave at `0`. |
| `NODE_ENV` | `development` | Set to `production` by the Docker image. |
| `SKIP_ENV_VALIDATION` | unset | Skips validation. Only used during the Docker build. |

AI is optional. Provider keys (OpenAI, Anthropic, Google) are **not** environment variables: each person adds their own in **Settings → Import and AI**, and they're stored encrypted with `ENCRYPTION_SECRET`.

## Generating secrets

Run this once for each secret, so `BETTER_AUTH_SECRET` and `ENCRYPTION_SECRET` get different values:

```bash
openssl rand -base64 48
```

That gives 64 characters with the mix of upper case, lower case, numbers and symbols `ENCRYPTION_SECRET` requires. Hex output (`openssl rand -hex 32`, `randomBytes(32).toString('hex')`) is **rejected** for `ENCRYPTION_SECRET` because it only has lower case and numbers.

Without `openssl`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Storage locations

These aren't configurable through environment variables:

- **Database:** wherever `DATABASE_URL` points. In Docker, mount `/app/data` as a volume.
- **Photos:** `./uploads` relative to the app (`/app/uploads` in Docker). Mount it as a volume so photos survive updates.
- **Migrations** run automatically every time the server starts.

## Minimal `.env.local`

```bash
DATABASE_URL="tastebase.db"
BETTER_AUTH_SECRET="<from the command above>"
BETTER_AUTH_URL="http://localhost:3000"
ENCRYPTION_SECRET="<from the command above>"
```

## Troubleshooting

- **"Invalid environment variables" on start:** the message names the variable. `ENCRYPTION_SECRET` is the usual one; regenerate it with the command above.
- **Sign-in redirects to the wrong address:** `BETTER_AUTH_URL` doesn't match the address in your browser.
- **AI keys stop working after changing `ENCRYPTION_SECRET`:** stored keys can't be decrypted with the new secret. Follow the rotation guide, or have people re-enter their keys in Settings.

More help: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

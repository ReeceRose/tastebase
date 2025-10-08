# Environment Variables Reference

## Required Variables

All of these environment variables are **required** for Tastebase to run.

### DATABASE_URL
- **Description**: SQLite database file location
- **Format**: `file:/app/data/tastebase.db`
- **Required**: Yes
- **Example**: `DATABASE_URL=file:/app/data/tastebase.db`

### BETTER_AUTH_SECRET
- **Description**: Secret key for authentication/session encryption
- **Min Length**: 32 characters
- **Required**: Yes
- **Generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Example**: `BETTER_AUTH_SECRET=a1b2c3d4e5f6...` (64 chars from hex)

### BETTER_AUTH_URL
- **Description**: Full URL where **users access** your app
- **Format**: Valid URL (http:// or https://)
- **Required**: Yes
- **Important**: This should be the **external URL**, not localhost!
- **Examples**:
  - Docker Desktop (Mac/Windows): `http://localhost:3000`
  - Unraid/Server: `http://192.168.1.100:3000` (use server IP)
  - With Domain: `https://recipes.yourdomain.com`
- **Why**: BetterAuth uses this for OAuth redirects and cookie domains

### ENCRYPTION_SECRET
- **Description**: Secret for encrypting AI API keys in database
- **Min Length**: 32 characters (recommended 64)
- **Required**: Yes
- **Requirements**:
  - ✅ Uppercase letters (A-Z)
  - ✅ Lowercase letters (a-z)
  - ✅ Numbers (0-9)
  - ✅ Special characters (!@#$%^&*)
  - ✅ High entropy (randomness)
- **Generate**:
  ```bash
  node -e "const crypto = require('crypto'); const hex = crypto.randomBytes(24).toString('hex'); const special = '!@#\$%^&*'; console.log('Prod' + hex + special.charAt(Math.floor(Math.random() * special.length)) + 'Key');"
  ```
- **Example**: `ProdAbc123!@#Def456$%^Ghi789&*(Jkl012*Key` (good variety)

- **Description**: Public-facing URL (used by client-side code)
- **Format**: Valid URL (http:// or https://)
- **Required**: Yes
- **Important**: Should **match `BETTER_AUTH_URL`** for consistency
- **Examples**:
  - Docker Desktop: `http://localhost:3000`
  - Unraid/Server: `http://192.168.1.100:3000` (same as server IP)
  - With Domain: `https://recipes.yourdomain.com`
- **Why**: Used by browser for API calls and redirects

## Optional Variables

### CURRENT_ENCRYPTION_VERSION
- **Description**: Version number for encryption key rotation
- **Default**: `1`
- **Type**: Number
- **Example**: `CURRENT_ENCRYPTION_VERSION=1`

### NODE_ENV
- **Description**: Runtime environment
- **Default**: `production` (in Docker)
- **Options**: `development`, `test`, `production`
- **Example**: `NODE_ENV=production`

### OLLAMA_BASE_URL
- **Description**: Ollama API endpoint for local AI
- **Default**: `http://localhost:11434`
- **Required**: No (only if using Ollama)
- **Example**: `OLLAMA_BASE_URL=http://192.168.1.50:11434`

## Quick Setup Guide

### 1. Copy Environment Template

```bash
cp .env.docker.example .env
```

### 2. Generate Secrets

```bash
# Generate BETTER_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_SECRET (with good variety)
node -e "const crypto = require('crypto'); const hex = crypto.randomBytes(24).toString('hex'); const special = '!@#\$%^&*'; console.log('Prod' + hex + special.charAt(Math.floor(Math.random() * special.length)) + 'Key');"
```

### 3. Edit .env File

```env
DATABASE_URL=file:/app/data/tastebase.db
BETTER_AUTH_SECRET=<your-generated-secret-from-step-2>
BETTER_AUTH_URL=http://YOUR_SERVER_IP:3000
ENCRYPTION_SECRET=<your-generated-encryption-secret-from-step-2>
CURRENT_ENCRYPTION_VERSION=1
```

### 4. Deploy

```bash
docker compose up -d
```

## Test Configuration

For testing/development, you can use these values:

```bash
docker run -d -p 3000:3000 \
  -e DATABASE_URL='file:/app/data/tastebase.db' \
  -e BETTER_AUTH_SECRET='test-secret-at-least-32-chars-long-for-testing' \
  -e BETTER_AUTH_URL='http://localhost:3000' \
  -e ENCRYPTION_SECRET='Test123!@#$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!' \
  reecerose/tastebase:latest
```

**⚠️ WARNING**: Never use test values in production!

## Validation Rules

### ENCRYPTION_SECRET Validation

The encryption secret must pass these checks:

1. **Minimum length**: 32 characters
2. **Character variety**: At least 3 of these 4 types:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%^&*()_+-=[]{}|;:,.<>?)
3. **Entropy**: High randomness (calculated automatically)

**Examples:**

✅ **Good:**
```
Test123!@#$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!
ProdAbc123!@#Def456$%^Ghi789&*(Jkl012*Key
My$ecure2024@Encrypti0n#Key!With%Variety^And*Length
```

❌ **Bad:**
```
mysecretkey                              # Too short, no variety
MYSECRETKEY1234567890                    # No special chars
my-secret-key-is-very-long              # No uppercase/numbers
12345678901234567890                     # Only numbers
```

## Common Errors

### "Invalid environment variables: DATABASE_URL expected string, received undefined"

**Problem**: `DATABASE_URL` not set

**Solution**: Add `DATABASE_URL=file:/app/data/tastebase.db` to your environment

### "ENCRYPTION_SECRET must have good entropy and character variety"

**Problem**: Secret doesn't meet complexity requirements

**Solution**: Use the generator command or ensure your secret has:
- Uppercase letters
- Lowercase letters
- Numbers
- Special characters

### "Invalid URL"

**Problem**: URL format is incorrect

**Solution**: Ensure URLs start with `http://` or `https://`

```bash
# ✅ Correct
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_URL=https://recipes.example.com

# ❌ Wrong
BETTER_AUTH_URL=localhost:3000           # Missing protocol
BETTER_AUTH_URL=www.example.com          # Missing protocol
```

## Security Best Practices

1. **Never commit secrets to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Use different secrets per environment**
   - Development secrets ≠ Production secrets
   - Each deployment should have unique secrets

3. **Rotate secrets periodically**
   - Update `BETTER_AUTH_SECRET` every 90 days
   - Use `CURRENT_ENCRYPTION_VERSION` for key rotation

4. **Store secrets securely**
   - Use environment variables or secret managers
   - Never hardcode in source code
   - Don't share via email/chat

5. **Generate with high entropy**
   - Use crypto libraries (not simple passwords)
   - Include full character variety
   - Make them long (64+ chars recommended)

## Troubleshooting

### Check Current Environment

```bash
# View environment in running container
docker exec tastebase env | grep -E "DATABASE_URL|BETTER_AUTH|ENCRYPTION|NEXT_PUBLIC"

# Check if all required vars are set
docker compose config | grep -E "DATABASE_URL|BETTER_AUTH|ENCRYPTION|NEXT_PUBLIC"
```

### Test Environment Locally

```bash
# Create test .env
cat > .env.test <<EOF
DATABASE_URL=file:/app/data/tastebase.db
BETTER_AUTH_SECRET=test-secret-at-least-32-chars-long-for-testing
BETTER_AUTH_URL=http://localhost:3000
ENCRYPTION_SECRET=Test123!@#\$%Encryption456&*()Secret789^&*With-Good-Entropy-64Chars!
EOF

# Test with docker run
docker run --env-file .env.test -p 3000:3000 reecerose/tastebase:latest
```

### Verify Validation

The validation happens at runtime when the container starts. Check logs:

```bash
docker logs tastebase 2>&1 | grep -i "invalid\|error"
```

## Reference

- **Environment validation**: `src/lib/config/env.ts`
- **Docker Compose**: `docker-compose.yml`
- **Environment template**: `.env.docker.example`
- **Quick test guide**: `QUICK_TEST.md`

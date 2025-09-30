# API Key Encryption Security Guide

This document explains how Tastebase securely encrypts and stores API keys for AI services (OpenAI, Anthropic, etc.).

## 🔐 Overview

Tastebase uses **AES-256-GCM encryption** with **scrypt key derivation** to protect AI service API keys. This provides military-grade security for your sensitive credentials.

### Security Features
- **AES-256-GCM**: Authenticated encryption preventing tampering
- **Unique encryption per key**: Each API key gets fresh salt and IV
- **Memory security**: Sensitive data cleared from memory after use
- **Key versioning**: Support for key rotation without data loss
- **Entropy validation**: Strong encryption keys enforced at startup

## 🛠️ Setup Requirements

### Environment Variables

```bash
# Required for AI features
ENCRYPTION_SECRET="your-64-character-encryption-secret"
CURRENT_ENCRYPTION_VERSION=1

# Must be different from your auth secret
BETTER_AUTH_SECRET="your-separate-auth-secret"
```

### Generate Secure Encryption Key

**Method 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Method 2: Using built-in generator**
```bash
# After app is running
node -e "console.log(require('./src/lib/crypto/encryption').generateSecureSecret(64))"
```

**Method 3: Online generator**
Use a reputable password generator with these settings:
- Length: 64 characters
- Include: Uppercase, lowercase, numbers, special characters

### Key Requirements

Your `ENCRYPTION_SECRET` must meet these security standards:

✅ **Required:**
- Minimum 32 characters (64 recommended)
- Different from `BETTER_AUTH_SECRET`
- High entropy (automatically validated)
- Character variety: 3+ of (uppercase, lowercase, numbers, special chars)

❌ **Invalid examples:**
```bash
# Too simple
ENCRYPTION_SECRET="password123"

# No variety
ENCRYPTION_SECRET="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

# Same as auth secret (security risk)
ENCRYPTION_SECRET="same-as-better-auth-secret"
```

✅ **Valid example:**
```bash
ENCRYPTION_SECRET="k8$mN2!pQ7rT9#vX3@wZ6&bC4*dF1+gH5%jL8^nM0-qS2~uY7"
```

## 🔄 Key Rotation

Key rotation allows you to change encryption keys while preserving access to existing encrypted data.

### When to Rotate Keys

- **Scheduled maintenance**: Every 6-12 months for security best practices
- **Security incident**: If you suspect key compromise
- **Compliance requirements**: Industry/regulatory mandates
- **Staff changes**: When team members with key access leave

### Rotation Process

1. **Backup current data**
   ```bash
   # Backup database
   cp tastebase.db tastebase.db.backup
   ```

2. **Generate new encryption key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Add new key to environment**
   ```bash
   # In .env.local, add new version
   ENCRYPTION_SECRET_V2="your-new-64-character-key"
   CURRENT_ENCRYPTION_VERSION=2
   ```

4. **Migrate existing data**
   ```bash
   # Run rotation script (create this in scripts/)
   pnpm run rotate-encryption-keys
   ```

5. **Verify and cleanup**
   ```bash
   # Test that AI features still work
   # Remove old key after successful verification
   ```

### Rollback Plan

If rotation fails:
```bash
# 1. Revert to previous version
CURRENT_ENCRYPTION_VERSION=1

# 2. Restart application
pnpm run build && pnpm start

# 3. Restore from backup if needed
cp tastebase.db.backup tastebase.db
```

## 🛡️ Security Best Practices

### Environment Security
- **Never commit secrets**: Use `.env.local`, add to `.gitignore`
- **Separate secrets**: Different keys for auth and encryption
- **Secure storage**: Use environment variable managers in production
- **Access control**: Limit who can view environment files

### Production Deployment
- **Docker secrets**: Use Docker secrets or K8s secrets instead of env files
- **Backup keys**: Securely store backup copies of encryption keys
- **Monitor access**: Log when encryption keys are accessed
- **Regular rotation**: Schedule periodic key rotation

### Troubleshooting

**Error: "ENCRYPTION_SECRET must have good entropy"**
```bash
# Your key is too simple. Generate a new one:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Error: "Decryption failed - invalid or corrupted data"**
- Check if `ENCRYPTION_SECRET` changed
- Verify `CURRENT_ENCRYPTION_VERSION` is correct
- Ensure data wasn't corrupted during backup/restore

**AI features not working after key change**
- Verify new encryption key is set correctly
- Check that encrypted API keys can be decrypted
- Review application logs for encryption errors

## 📊 Security Audit Checklist

- [ ] `ENCRYPTION_SECRET` is at least 64 characters
- [ ] Encryption key is different from auth secret
- [ ] Key has good entropy and character variety
- [ ] Environment variables are not committed to git
- [ ] Backup procedures include encryption keys
- [ ] Key rotation schedule is documented
- [ ] Team knows rollback procedures
- [ ] Production uses secure secret management

## 🔬 Technical Details

### Encryption Algorithm
- **Cipher**: AES-256-GCM (authenticated encryption)
- **Key derivation**: scrypt with secure parameters (N=32768, r=8, p=1)
- **Randomness**: Cryptographically secure random IVs and salts
- **Authentication**: Built-in tamper detection via GCM tags

### Data Format
```json
{
  "version": 1,
  "iv": "hex-encoded-initialization-vector",
  "salt": "hex-encoded-salt-for-key-derivation",
  "tag": "hex-encoded-authentication-tag",
  "encrypted": "hex-encoded-ciphertext"
}
```

### Memory Security
- Sensitive buffers cleared after use
- No secrets logged to console/files
- Constant-time operations prevent timing attacks
- Generic error messages prevent information leakage

This encryption system provides enterprise-grade security while remaining simple to deploy and manage.
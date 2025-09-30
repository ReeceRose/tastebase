# API Key Rotation Guide

This guide provides step-by-step procedures for rotating encryption keys in Tastebase.

## 🎯 When to Rotate Keys

### Scheduled Rotation
- **Recommended**: Every 6-12 months for security best practices
- **Compliance**: Some industries require quarterly or annual rotation
- **Policy**: Establish rotation schedule based on your security requirements

### Emergency Rotation
- **Security incident**: Suspected key compromise or data breach
- **Staff changes**: Team member with key access leaves organization
- **System compromise**: Server or deployment environment was breached
- **Regulatory requirement**: Audit findings or compliance mandates

## 📋 Pre-Rotation Checklist

Before starting key rotation, ensure you have:

- [ ] **Maintenance window scheduled** (15-30 minutes downtime)
- [ ] **Current database backup** (recent and verified)
- [ ] **Development environment** to test rotation process
- [ ] **Rollback plan** documented and understood
- [ ] **Team notification** of scheduled maintenance
- [ ] **Access to environment variables** and deployment system

## 🔄 Rotation Procedure

### Step 1: Backup Current State

```bash
# 1. Stop the application
docker-compose down
# OR for development
pkill -f "next"

# 2. Backup database
cp tastebase.db tastebase.db.backup-$(date +%Y%m%d-%H%M%S)

# 3. Backup current environment
cp .env.local .env.local.backup-$(date +%Y%m%d-%H%M%S)
```

### Step 2: Generate New Encryption Key

```bash
# Generate secure 64-character key
node -e "console.log('New encryption key:', require('crypto').randomBytes(32).toString('hex'))"
```

**Save this key securely** - you'll need it for the next steps.

### Step 3: Update Environment Configuration

Edit your `.env.local` file:

```bash
# Keep existing key as V1
ENCRYPTION_SECRET="your-current-key"

# Add new key as V2
ENCRYPTION_SECRET_V2="your-new-generated-key"

# Update version to use new key for new encryptions
CURRENT_ENCRYPTION_VERSION=2
```

### Step 4: Create Migration Script

Create `scripts/rotate-encryption-keys.ts`:

```typescript
import { db } from "@/db";
import { rotateEncryption, getEncryptionVersion } from "@/lib/crypto/encryption";

async function rotateAllEncryptedData() {
  console.log("Starting encryption key rotation...");

  // Find all encrypted API keys in your database
  const usersWithApiKeys = await db.query.users.findMany({
    where: (users, { isNotNull }) => isNotNull(users.encryptedApiKey),
    columns: { id: true, encryptedApiKey: true }
  });

  let rotated = 0;
  let errors = 0;

  for (const user of usersWithApiKeys) {
    try {
      if (user.encryptedApiKey) {
        const currentVersion = getEncryptionVersion(user.encryptedApiKey);
        console.log(`User ${user.id}: current version ${currentVersion}`);

        if (currentVersion === 1) {
          const rotatedData = await rotateEncryption(user.encryptedApiKey, 2);

          await db.update(users).set({
            encryptedApiKey: rotatedData
          }).where(eq(users.id, user.id));

          rotated++;
          console.log(`✅ Rotated user ${user.id}`);
        }
      }
    } catch (error) {
      errors++;
      console.error(`❌ Failed to rotate user ${user.id}:`, error);
    }
  }

  console.log(`\nRotation complete:`);
  console.log(`- Successfully rotated: ${rotated} keys`);
  console.log(`- Errors: ${errors} keys`);

  if (errors > 0) {
    console.log("\n⚠️  Some keys failed to rotate. Check errors above.");
    process.exit(1);
  }
}

rotateAllEncryptedData().catch(console.error);
```

### Step 5: Run Migration

```bash
# Test in development first
NODE_ENV=development tsx scripts/rotate-encryption-keys.ts

# If successful, run in production
NODE_ENV=production tsx scripts/rotate-encryption-keys.ts
```

### Step 6: Verify Rotation Success

```bash
# 1. Start application
docker-compose up -d
# OR for development
pnpm run dev

# 2. Test AI features
# - Go to Settings page
# - Verify AI service connections work
# - Test recipe parsing functionality

# 3. Check application logs for encryption errors
docker-compose logs app | grep -i "encryption\|decrypt"
```

### Step 7: Cleanup Old Key

After verifying everything works:

```bash
# Edit .env.local to remove old key
# Remove: ENCRYPTION_SECRET="old-key"
# Keep: ENCRYPTION_SECRET_V2="new-key"
# Rename V2 to primary: ENCRYPTION_SECRET="new-key"
# Update: CURRENT_ENCRYPTION_VERSION=2
```

Final `.env.local`:
```bash
ENCRYPTION_SECRET="your-new-generated-key"
CURRENT_ENCRYPTION_VERSION=2
```

## 🚨 Rollback Procedure

If rotation fails:

### Step 1: Immediate Rollback
```bash
# 1. Stop application
docker-compose down

# 2. Restore environment
cp .env.local.backup-YYYYMMDD-HHMMSS .env.local

# 3. Restore database (if needed)
cp tastebase.db.backup-YYYYMMDD-HHMMSS tastebase.db

# 4. Restart application
docker-compose up -d
```

### Step 2: Verify Rollback
```bash
# Test that everything works as before
# Check AI features are functional
# Review logs for any remaining issues
```

### Step 3: Investigate Failure
```bash
# Review migration logs
# Check for specific error patterns
# Test rotation in development environment
# Fix issues before attempting again
```

## ✅ Post-Rotation Checklist

After successful rotation:

- [ ] **Verify AI features work** - Test all AI-dependent functionality
- [ ] **Check application logs** - No encryption/decryption errors
- [ ] **Update documentation** - Record rotation date and new version
- [ ] **Secure key storage** - Store new key in secure location
- [ ] **Delete old backups** - Securely remove old keys and data (after retention period)
- [ ] **Team notification** - Inform team that maintenance is complete
- [ ] **Schedule next rotation** - Add next rotation to calendar

## 📊 Rotation Tracking

Keep a rotation log:

```
Rotation History:
- 2024-01-15: Initial deployment (v1)
- 2024-07-15: Scheduled rotation (v1 → v2) ✅
- 2024-12-10: Emergency rotation (v2 → v3) ✅
```

## 🛠️ Troubleshooting

### Common Issues

**Migration script fails with "Decryption failed"**
- Verify `ENCRYPTION_SECRET` hasn't changed
- Check `CURRENT_ENCRYPTION_VERSION` is correct
- Ensure database wasn't corrupted

**Some keys rotate, others fail**
- Check individual error messages
- Some keys might already be newer version
- Verify database connection stability during migration

**Application won't start after rotation**
- Check environment variable syntax
- Verify new key meets entropy requirements
- Review application startup logs

**AI features stop working**
- Verify encrypted API keys are accessible
- Test decryption of individual keys
- Check if API keys themselves are still valid

### Recovery Commands

```bash
# Check encryption key versions in database
node -e "
const { db } = require('./db');
db.query.users.findMany().then(users => {
  users.forEach(u => {
    if (u.encryptedApiKey) {
      const version = require('./src/lib/crypto/encryption').getEncryptionVersion(u.encryptedApiKey);
      console.log(\`User \${u.id}: version \${version}\`);
    }
  });
});
"

# Test decryption of specific key
node -e "
const { safeDecrypt } = require('./src/lib/crypto/encryption');
safeDecrypt('encrypted-data-here').then(result => {
  console.log('Decryption test:', result ? 'SUCCESS' : 'FAILED');
});
"
```

## 🔐 Security Considerations

- **Timing**: Rotate during low-usage periods
- **Backup security**: Encrypt backups containing old keys
- **Key disposal**: Securely wipe old keys from all locations
- **Access logging**: Log who performed rotation and when
- **Testing**: Always test rotation in development first
- **Documentation**: Keep detailed records of all rotations

Remember: Key rotation is a critical security operation. Take your time, follow procedures carefully, and always have a rollback plan ready.
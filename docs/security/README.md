# Security Documentation

This directory contains security documentation for Tastebase's encryption and key management systems.

## 📚 Documentation Overview

### [Encryption Guide](./encryption.md)
Comprehensive guide to API key encryption in Tastebase:
- Security features and technical details
- Environment setup and key generation
- Security best practices
- Troubleshooting and audit checklist

### [Key Rotation Guide](./key-rotation.md)
Step-by-step procedures for rotating encryption keys:
- When and why to rotate keys
- Complete rotation procedure with commands
- Rollback procedures for failed rotations
- Post-rotation verification and troubleshooting

## 🔐 Quick Security Setup

### 1. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to Environment
```bash
# In .env.local
ENCRYPTION_SECRET="your-generated-64-character-key"
CURRENT_ENCRYPTION_VERSION=1
```

### 3. Verify Security
- Encryption key is different from auth secret
- Key has good entropy and character variety
- Environment variables are not committed to git

## 🛡️ Security Features

- **AES-256-GCM encryption** with authentication
- **scrypt key derivation** with secure parameters
- **Versioned encryption** for seamless key rotation
- **Memory security** with buffer clearing
- **Entropy validation** at startup
- **Error handling** that prevents information leakage

## 📋 Security Checklist

- [ ] Strong encryption keys generated
- [ ] Separate keys for auth and encryption
- [ ] Environment variables secured
- [ ] Key rotation schedule established
- [ ] Backup procedures documented
- [ ] Team trained on security procedures

## 🚨 Security Incidents

If you suspect a security issue:

1. **Immediate**: Rotate encryption keys using the [Key Rotation Guide](./key-rotation.md)
2. **Investigate**: Review logs for suspicious activity
3. **Document**: Record incident details and response actions
4. **Improve**: Update procedures based on lessons learned

## 📞 Support

For security-related questions or incidents:
- Review documentation in this directory
- Check application logs for error details
- Test procedures in development environment first
- Keep detailed records of all security operations

## 🔄 Regular Maintenance

### Monthly
- [ ] Review application logs for encryption errors
- [ ] Verify backup procedures are working
- [ ] Check team access to security documentation

### Quarterly
- [ ] Review and update security procedures
- [ ] Test key rotation in development environment
- [ ] Audit encryption key storage and access

### Annually
- [ ] Perform scheduled key rotation
- [ ] Security audit of encryption implementation
- [ ] Update team training on security procedures
- [ ] Review and update incident response procedures
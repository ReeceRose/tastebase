import * as crypto from "node:crypto";
import { env } from "@/lib/config/env";

interface EncryptedData {
  version: number;
  iv: string;
  salt: string;
  tag: string;
  encrypted: string;
}

interface ScryptOptions {
  N: number;
  r: number;
  p: number;
}

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

const SCRYPT_OPTIONS: ScryptOptions = {
  N: 16384, // Reduced from 32768 to avoid memory limit exceeded
  r: 8,
  p: 1,
};

function scryptAsync(
  password: string | Buffer,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions = SCRYPT_OPTIONS,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

function calculateEntropy(text: string): number {
  const charCounts = new Map<string, number>();
  for (const char of text) {
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
  }

  let entropy = 0;
  const textLength = text.length;
  for (const count of charCounts.values()) {
    const probability = count / textLength;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function validateEncryptionKey(key: string): boolean {
  if (!key || key.length < 32) {
    return false;
  }

  const entropy = calculateEntropy(key);
  const hasUpperCase = /[A-Z]/.test(key);
  const hasLowerCase = /[a-z]/.test(key);
  const hasNumbers = /[0-9]/.test(key);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(key);

  const varietyScore = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  return entropy > 4.0 && varietyScore >= 3;
}

function getEncryptionKey(
  version: number = env.CURRENT_ENCRYPTION_VERSION,
): string {
  const keys: Record<number, string | undefined> = {
    1: env.ENCRYPTION_SECRET,
  };

  const key = keys[version];
  if (!key) {
    throw new Error(`Encryption key version ${version} not configured`);
  }

  if (!validateEncryptionKey(key)) {
    throw new Error(
      `ENCRYPTION_SECRET (version ${version}) must be at least 32 characters with good entropy and character variety`,
    );
  }

  return key;
}

function clearBuffer(buffer: Buffer | null): void {
  if (buffer && Buffer.isBuffer(buffer)) {
    buffer.fill(0);
  }
}

export async function encrypt(
  text: string,
  version: number = env.CURRENT_ENCRYPTION_VERSION,
): Promise<string> {
  let salt: Buffer | null = null;
  let iv: Buffer | null = null;
  let key: Buffer | null = null;

  try {
    if (!text || typeof text !== "string") {
      throw new Error("Text to encrypt must be a non-empty string");
    }

    salt = crypto.randomBytes(SALT_LENGTH);
    iv = crypto.randomBytes(IV_LENGTH);
    const password = getEncryptionKey(version);

    key = await scryptAsync(password, salt, KEY_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    const result: EncryptedData = {
      version,
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
      tag: tag.toString("hex"),
      encrypted: encrypted,
    };

    return Buffer.from(JSON.stringify(result)).toString("base64");
  } catch (error) {
    console.error("Encryption failed with error:", error);
    throw new Error(
      `Encryption operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearBuffer(salt);
    clearBuffer(iv);
    clearBuffer(key);
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  let salt: Buffer | null = null;
  let iv: Buffer | null = null;
  let tag: Buffer | null = null;
  let key: Buffer | null = null;

  try {
    if (!encryptedData || typeof encryptedData !== "string") {
      throw new Error("Invalid encrypted data format");
    }

    let data: EncryptedData;
    try {
      data = JSON.parse(Buffer.from(encryptedData, "base64").toString("utf8"));
    } catch {
      throw new Error("Invalid encrypted data format");
    }

    if (
      !data.version ||
      !data.iv ||
      !data.salt ||
      !data.tag ||
      !data.encrypted
    ) {
      throw new Error("Invalid encrypted data format");
    }

    salt = Buffer.from(data.salt, "hex");
    iv = Buffer.from(data.iv, "hex");
    tag = Buffer.from(data.tag, "hex");
    const password = getEncryptionKey(data.version);

    key = await scryptAsync(password, salt, KEY_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(data.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed with error:", error);
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    clearBuffer(salt);
    clearBuffer(iv);
    clearBuffer(tag);
    clearBuffer(key);
  }
}

export async function safeEncrypt(
  text: string | null,
  version: number = env.CURRENT_ENCRYPTION_VERSION,
): Promise<string | null> {
  if (!text || text.trim() === "") {
    return null;
  }
  try {
    return await encrypt(text, version);
  } catch (error) {
    console.error(
      "Encryption error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error("Full error object:", error);
    return null;
  }
}

export async function safeDecrypt(
  encryptedData: string | null,
): Promise<string | null> {
  if (!encryptedData) {
    return null;
  }
  try {
    return await decrypt(encryptedData);
  } catch (error) {
    console.error(
      "Decryption error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

export function validateApiKey(apiKey: string | null): boolean {
  return !!(apiKey && apiKey.trim().length > 0);
}

export function maskApiKey(apiKey: string | null): string {
  if (!apiKey) return "";
  if (apiKey.length <= 8) return "•".repeat(apiKey.length);
  return `${apiKey.slice(0, 4)}${("•").repeat(apiKey.length - 8)}${apiKey.slice(-4)}`;
}

export async function rotateEncryption(
  encryptedData: string,
  targetVersion: number,
): Promise<string> {
  try {
    const decryptedText = await decrypt(encryptedData);
    return await encrypt(decryptedText, targetVersion);
  } catch {
    throw new Error(
      "Key rotation failed - could not decrypt or re-encrypt data",
    );
  }
}

export function getEncryptionVersion(encryptedData: string): number | null {
  try {
    const data: EncryptedData = JSON.parse(
      Buffer.from(encryptedData, "base64").toString("utf8"),
    );
    return data.version || null;
  } catch {
    return null;
  }
}

export function generateSecureSecret(length: number = 64): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }

  return result;
}

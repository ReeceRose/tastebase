import { describe, expect, it } from "vitest";
import {
  decrypt,
  encrypt,
  safeDecrypt,
  safeEncrypt,
} from "@/lib/crypto/encryption";
import { maskApiKey, validateApiKey } from "@/lib/crypto/utils";

describe("Encryption Functions", () => {
  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt text successfully", async () => {
      const plaintext = "sk-test-api-key-123456789";

      const encrypted = await encrypt(plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different encrypted output for the same input", async () => {
      const plaintext = "test-api-key";

      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      const decrypted1 = await decrypt(encrypted1);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it("should handle unicode characters", async () => {
      const plaintext = "test-key-with-unicode-🔐-characters";

      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle very long strings", async () => {
      const plaintext = "a".repeat(10000);

      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should throw error when decrypting invalid data", async () => {
      await expect(decrypt("invalid-data")).rejects.toThrow(
        "Decryption failed",
      );
    });
  });

  describe("safe encrypt and decrypt", () => {
    it("should return null for empty or null input", async () => {
      expect(await safeEncrypt(null)).toBeNull();
      expect(await safeEncrypt("")).toBeNull();
      expect(await safeEncrypt("   ")).toBeNull();

      expect(await safeDecrypt(null)).toBeNull();
      expect(await safeDecrypt("")).toBeNull();
    });

    it("should safely encrypt and decrypt valid input", async () => {
      const plaintext = "test-api-key";

      const encrypted = await safeEncrypt(plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await safeDecrypt(encrypted ?? "");
      expect(decrypted).toBe(plaintext);
    });

    it("should return null on decryption error", async () => {
      const result = await safeDecrypt("invalid-data");
      expect(result).toBeNull();
    });
  });

  describe("validateApiKey", () => {
    it("should validate API keys correctly", () => {
      expect(validateApiKey("sk-valid-key")).toBe(true);
      expect(validateApiKey("")).toBe(false);
      expect(validateApiKey(null)).toBe(false);
      expect(validateApiKey("   ")).toBe(false);
    });
  });

  describe("maskApiKey", () => {
    it("should mask API keys correctly", () => {
      expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-1•••••••••••cdef");
      expect(maskApiKey("short")).toBe("•••••");
      expect(maskApiKey("")).toBe("");
      expect(maskApiKey(null)).toBe("");
    });
  });
});

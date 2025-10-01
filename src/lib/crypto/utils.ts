export function validateApiKey(apiKey: string | null): boolean {
  return !!(apiKey && apiKey.trim().length > 0);
}

export function maskApiKey(apiKey: string | null): string {
  if (!apiKey) return "";
  if (apiKey.length <= 8) return "•".repeat(apiKey.length);
  return `${apiKey.slice(0, 4)}${("•").repeat(apiKey.length - 8)}${apiKey.slice(-4)}`;
}

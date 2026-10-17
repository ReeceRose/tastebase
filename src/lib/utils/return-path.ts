export const RETURN_PATH_PARAM = "next";

// Only paths inside Tastebase are allowed, so a crafted sign-in link can't
// send someone to another site after they sign in.
export function safeReturnPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  if (value.startsWith("/auth") || value.includes("\\")) {
    return "/";
  }
  return value;
}

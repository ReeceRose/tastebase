import { createAuthClient } from "better-auth/react";

// BetterAuth client auto-detects the baseURL from window.location in the browser
export const authClient = createAuthClient();

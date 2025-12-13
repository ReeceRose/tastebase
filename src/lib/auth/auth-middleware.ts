import { createOperationLogger } from "@/lib/logging/logger";

const _logger = createOperationLogger("auth-middleware");

// Define protected route patterns
const _PROTECTED_ROUTES = ["/recipes", "/settings", "/api/recipes"];

const PUBLIC_ROUTES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/reset-password",
  "/",
];

// Helper function to check if a route is public
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
}

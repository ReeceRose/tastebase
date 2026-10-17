import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { ResetPasswordTokenForm } from "@/components/auth/reset-password-token-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata = {
  title: "Reset Password | Tastebase",
  description: "Reset your password to access your recipe collection",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <AuthShell>
      <div>
        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error === "INVALID_TOKEN"
                  ? "That reset link has expired or was already used. Ask for a new one below."
                  : "That didn't work. Ask for a new reset link below."}
              </AlertDescription>
            </Alert>
            <PasswordResetForm />
          </div>
        ) : token ? (
          <ResetPasswordTokenForm token={token} />
        ) : (
          <PasswordResetForm />
        )}
      </div>
    </AuthShell>
  );
}

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { ResetPasswordTokenForm } from "@/components/auth/reset-password-token-form";
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
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error === "INVALID_TOKEN"
                  ? "This password reset link is invalid or has expired. Please request a new one."
                  : "An error occurred. Please try again."}
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
    </div>
  );
}

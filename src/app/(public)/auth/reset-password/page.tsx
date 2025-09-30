import { PasswordResetForm } from "@/components/auth/password-reset-form";

export const metadata = {
  title: "Reset Password | Tastebase",
  description: "Reset your password to access your recipe collection",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <PasswordResetForm />
      </div>
    </div>
  );
}

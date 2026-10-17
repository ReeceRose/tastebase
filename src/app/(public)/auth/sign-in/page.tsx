import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata = {
  title: "Sign in | Tastebase",
};

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}

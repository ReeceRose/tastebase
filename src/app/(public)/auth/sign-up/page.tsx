import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata = {
  title: "Create your account | Tastebase",
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}

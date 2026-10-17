import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { safeReturnPath } from "@/lib/utils/return-path";

export const metadata = {
  title: "Sign in | Tastebase",
};

interface SignInPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams;

  return (
    <AuthShell>
      <SignInForm returnTo={safeReturnPath(next ?? null)} />
    </AuthShell>
  );
}

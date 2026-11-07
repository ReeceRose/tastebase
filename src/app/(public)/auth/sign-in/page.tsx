import { Suspense } from "react";
import { CreateAccountLink } from "@/components/auth/create-account-link";
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
      <SignInForm
        returnTo={safeReturnPath(next ?? null)}
        createAccountLink={
          <Suspense fallback={null}>
            <CreateAccountLink />
          </Suspense>
        }
      />
    </AuthShell>
  );
}

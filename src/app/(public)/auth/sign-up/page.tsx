import { Suspense } from "react";
import { SignUpGate } from "@/components/auth/sign-up-gate";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthFormSkeleton } from "@/components/skeletons/auth-form-skeleton";

export const metadata = {
  title: "Create your account | Tastebase",
};

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthFormSkeleton />}>
        <SignUpGate />
      </Suspense>
    </AuthShell>
  );
}

import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  areSignUpsOpen,
  SIGN_UPS_CLOSED_MESSAGE,
} from "@/lib/auth/sign-up-policy";

export async function SignUpGate() {
  if (await areSignUpsOpen()) {
    return <SignUpForm />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[28px] leading-tight tracking-[-0.03em]">
          Sign-ups are closed
        </CardTitle>
        <CardDescription>{SIGN_UPS_CLOSED_MESSAGE}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/sign-in" className="underline underline-offset-4">
          Sign in instead
        </Link>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { areSignUpsOpen } from "@/lib/auth/sign-up-policy";

export async function CreateAccountLink() {
  if (!(await areSignUpsOpen())) {
    return null;
  }

  return (
    <div className="mt-4 text-center text-sm">
      New here?{" "}
      <Link href="/auth/sign-up" className="underline underline-offset-4">
        Create an account
      </Link>
    </div>
  );
}

import { SignUpForm } from "@/components/auth/sign-up-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh w-full flex-col p-6 md:p-10">
      <div className="flex w-full justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { signUpAction } from "@/lib/auth/auth-actions";
import { cn } from "@/lib/utils/utils";

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedValues = watch();
  const password = watchedValues.password;

  // Enable submit when required fields have content
  const hasRequiredFields =
    watchedValues.name &&
    watchedValues.email &&
    watchedValues.password &&
    watchedValues.confirmPassword;

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await signUpAction(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-3">
                <Label htmlFor={nameId}>Full name</Label>
                <Input
                  id={nameId}
                  type="text"
                  placeholder="John Doe"
                  disabled={isLoading}
                  required
                  {...register("name")}
                />
                {errors.name && touchedFields.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={emailId}>Email</Label>
                <Input
                  id={emailId}
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading}
                  required
                  {...register("email")}
                />
                {errors.email && touchedFields.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={passwordId}>Password</Label>
                <Input
                  id={passwordId}
                  type="password"
                  disabled={isLoading}
                  required
                  {...register("password")}
                />
                {errors.password && touchedFields.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
                {password && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex gap-2">
                      <span
                        className={
                          password.length >= 8
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ At least 8 characters
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={
                          /[A-Z]/.test(password)
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ One uppercase letter
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={
                          /[a-z]/.test(password)
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ One lowercase letter
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={
                          /[0-9]/.test(password)
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        ✓ One number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor={confirmPasswordId}>Confirm password</Label>
                <Input
                  id={confirmPasswordId}
                  type="password"
                  disabled={isLoading}
                  required
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && touchedFields.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !hasRequiredFields}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loading size="sm" />
                      Creating account...
                    </div>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { authClient } from "@/lib/auth/auth-client";
import { ComponentSize } from "@/lib/types";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordTokenForm({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Watch form values to enable submit button when fields have content
  const watchedValues = watch();
  const hasRequiredFields =
    watchedValues.newPassword && watchedValues.confirmPassword;

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.resetPassword({
        newPassword: data.newPassword,
        token,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reset password");
      } else {
        setSuccess(true);
        router.push("/auth/sign-in");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Enter your new password below to complete the reset.
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

            {success && (
              <Alert>
                <AlertDescription>
                  Password reset successful. Redirecting to sign in...
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3">
              <Label htmlFor={newPasswordId}>New Password</Label>
              <Input
                id={newPasswordId}
                type="password"
                disabled={isLoading}
                required
                {...register("newPassword")}
              />
              {errors.newPassword && touchedFields.newPassword && (
                <p className="text-sm text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor={confirmPasswordId}>Confirm Password</Label>
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
                disabled={isLoading || !hasRequiredFields || success}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loading size={ComponentSize.SM} />
                    Resetting password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            Remember your password?{" "}
            <Link href="/auth/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useId, useState } from "react";
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
import { updatePassword } from "@/lib/auth/auth-actions";
import { ComponentSize, MessageType } from "@/lib/types";

export function PasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: MessageType;
    text: string;
  } | null>(null);
  const formId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updatePassword(formData);

      if (result.success) {
        setMessage({ type: MessageType.SUCCESS, text: result.message });
        // Clear form
        const form = document.getElementById(formId) as HTMLFormElement;
        form?.reset();
      } else {
        setMessage({
          type: MessageType.ERROR,
          text: result.error || "Failed to update password",
        });
      }
    } catch (error) {
      console.error("Password update error:", error);
      setMessage({
        type: MessageType.ERROR,
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert
            variant={
              message.type === MessageType.ERROR ? "destructive" : "default"
            }
            className={
              message.type === MessageType.SUCCESS
                ? "border-primary bg-primary/10 [&>*[data-slot=alert-description]]:text-primary"
                : ""
            }
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form id={formId} action={handleSubmit} className="space-y-4">
          {/* Hidden username field for accessibility and password manager compatibility */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            style={{ display: "none" }}
            tabIndex={-1}
            readOnly
            aria-hidden="true"
          />

          <div className="space-y-2">
            <Label htmlFor={currentPasswordId}>Current Password</Label>
            <Input
              id={currentPasswordId}
              name="currentPassword"
              type="password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={newPasswordId}>New Password</Label>
            <Input
              id={newPasswordId}
              name="newPassword"
              type="password"
              required
              disabled={isLoading}
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
            <Input
              id={confirmPasswordId}
              name="confirmPassword"
              type="password"
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loading size={ComponentSize.SM} />
                Updating...
              </div>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

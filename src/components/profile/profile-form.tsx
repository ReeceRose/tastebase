"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
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
import { updateProfile } from "@/lib/auth/auth-actions";
import { authClient } from "@/lib/auth/auth-client";

interface ProfileFormProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const emailId = useId();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        setMessage({ type: "success", text: result.message });

        // Update the input value to reflect the change
        if (nameInputRef.current) {
          const newName = formData.get("name") as string;
          nameInputRef.current.value = newName;
        }

        // Update the session using Better Auth client
        try {
          await authClient.updateUser({
            name: result.updatedName,
          });

          // Refresh server components to show updated data everywhere
          router.refresh();
        } catch (sessionError) {
          console.error("Session update error:", sessionError);
          // Still refresh to show database changes
          router.refresh();
        }
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and account details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={
              message.type === "success"
                ? "border-primary bg-primary/10 [&>*[data-slot=alert-description]]:text-primary"
                : ""
            }
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Full Name</Label>
            <Input
              ref={nameInputRef}
              id={nameId}
              name="name"
              type="text"
              defaultValue={user.name || ""}
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailId}>Email Address</Label>
            <Input
              id={emailId}
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update
              your email.
            </p>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loading size="sm" />
                Updating...
              </div>
            ) : (
              "Update Profile"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import { ButtonVariant } from "@/lib/types";

export function DeleteAccount() {
  const router = useRouter();
  const passwordId = useId();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setPassword("");
      setError(null);
    }
  };

  const confirm = () => {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setError(null);
    startDeleting(async () => {
      const result = await authClient.deleteUser({ password });
      if (result.error) {
        setError(
          result.error.message ||
            "That didn't work. Check your password and try again.",
        );
        return;
      }
      router.push("/auth/sign-in");
      router.refresh();
    });
  };

  return (
    <section
      aria-labelledby="delete-account-title"
      className="space-y-3 rounded-tile bg-card p-6"
    >
      <h3
        id="delete-account-title"
        className="text-xl font-extrabold tracking-[-0.02em]"
      >
        Delete your account
      </h3>
      <p className="max-w-[60ch] text-muted-foreground">
        Removes your account, every recipe you added, their photos and your
        notes, for good. Recipes you shared will disappear for everyone in the
        house.
      </p>
      <Button
        variant={ButtonVariant.OUTLINE}
        onClick={() => setOpen(true)}
        className="border-destructive text-destructive hover:bg-destructive/10"
      >
        Delete my account
      </Button>

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your recipes, photos and notes immediately and can't
              be undone. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label htmlFor={passwordId} className="block text-meta">
              Password
            </label>
            <Input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirm();
                }
              }}
            />
            {error && (
              <p role="alert" className="text-caption text-destructive">
                {error}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Keep my account
            </AlertDialogCancel>
            <Button
              variant={ButtonVariant.DESTRUCTIVE}
              onClick={confirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

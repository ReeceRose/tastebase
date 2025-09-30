"use client";

import {
  AlertTriangle,
  Calendar,
  LogOut,
  MapPin,
  Monitor,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSecurityMetrics,
  getUserSessions,
  revokeAllOtherSessions,
  revokeSession,
} from "@/lib/server-actions/session-actions";
import { MessageType } from "@/lib/types";

interface SessionInfo {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress?: string;
}

interface SecurityMetrics {
  lastLogin: string;
  passwordLastChanged: string;
  accountCreated: string;
  activeSessions: number;
  loginAttempts: number;
}

export function SecuritySettingsForm() {
  const [message, setMessage] = useState<{
    type: MessageType;
    text: string;
  } | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [securityMetrics, setSecurityMetrics] =
    useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const [revokeState, revokeAction, isRevoking] = useActionState(
    async (
      _state:
        | { success: true; message: string }
        | { success: false; error: string }
        | null,
      formData: FormData,
    ) => await revokeSession(formData),
    null,
  );
  const [revokeAllState, revokeAllAction, isRevokingAll] = useActionState(
    async (
      _state:
        | { success: true; message: string; revokedCount: number }
        | { success: false; error: string }
        | null,
      _formData: FormData,
    ) => await revokeAllOtherSessions(),
    null,
  );

  useEffect(() => {
    async function loadSecurityData() {
      try {
        const [sessionsResult, metricsResult] = await Promise.all([
          getUserSessions().catch(() => ({
            success: false as const,
            error: "Failed to load sessions",
          })),
          getSecurityMetrics().catch(() => ({
            success: false as const,
            error: "Failed to load metrics",
          })),
        ]);

        if (sessionsResult.success) {
          setSessions(sessionsResult.data);
        } else {
          console.error("Failed to load sessions:", sessionsResult.error);
        }

        if (metricsResult.success) {
          setSecurityMetrics(metricsResult.data);
        } else {
          console.error("Failed to load metrics:", metricsResult.error);
        }

        if (!sessionsResult.success && !metricsResult.success) {
          setError("Failed to load security data");
        }
      } catch (err) {
        console.error("Failed to load security data:", err);
        setError("Failed to load security data");
      } finally {
        setIsLoading(false);
      }
    }

    loadSecurityData();
  }, []);

  // Refresh data when actions complete successfully
  useEffect(() => {
    if (revokeState?.success || revokeAllState?.success) {
      // Reload sessions after successful revocation
      getUserSessions().then((result) => {
        if (result.success) {
          setSessions(result.data);
        }
      });
    }
  }, [revokeState, revokeAllState]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getDeviceIcon = (device: string) => {
    if (
      device.toLowerCase().includes("iphone") ||
      device.toLowerCase().includes("android")
    ) {
      return Smartphone;
    }
    return Monitor;
  };

  const handleDeleteAccount = async () => {
    try {
      // This would be a real account deletion flow
      setMessage({
        type: MessageType.WARNING,
        text: "Account deletion initiated. Check your email for confirmation.",
      });
    } catch {
      setMessage({
        type: MessageType.ERROR,
        text: "Failed to initiate account deletion",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Overview
        </CardTitle>
        <CardDescription>
          Monitor your account security and manage active sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(message || revokeState || revokeAllState) && (
          <Alert
            variant={
              message?.type === MessageType.ERROR ||
              (revokeState && !revokeState.success) ||
              (revokeAllState && !revokeAllState.success)
                ? "destructive"
                : "default"
            }
            className={
              message?.type === MessageType.SUCCESS ||
              revokeState?.success ||
              revokeAllState?.success
                ? "border-primary bg-primary/10 [&>*[data-slot=alert-description]]:text-primary"
                : message?.type === MessageType.WARNING
                  ? "border-chart-3 bg-chart-3/10 [&>*[data-slot=alert-description]]:text-chart-3"
                  : ""
            }
          >
            <AlertDescription>
              {message?.text ||
                (revokeState?.success
                  ? revokeState.message
                  : revokeState && !revokeState.success
                    ? revokeState.error
                    : null) ||
                (revokeAllState?.success
                  ? revokeAllState.message
                  : revokeAllState && !revokeAllState.success
                    ? revokeAllState.error
                    : null)}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={`security-metric-skeleton-${index}`}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>

              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={`session-skeleton-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {securityMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last login:</span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(securityMetrics.lastLogin)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Password changed:
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatDate(securityMetrics.passwordLastChanged)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Active sessions:
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {securityMetrics.activeSessions} devices
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Failed login attempts:
                    </span>
                  </div>
                  <p className="text-sm font-medium text-chart-2">
                    {securityMetrics.loginAttempts} (last 30 days)
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Sessions</h4>
                <form action={revokeAllAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRevokingAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isRevokingAll ? "Revoking..." : "Revoke All Others"}
                  </Button>
                </form>
              </div>

              <div className="space-y-3">
                {(showAllSessions ? sessions : sessions.slice(0, 5)).map(
                  (session) => {
                    const Icon = getDeviceIcon(session.device);
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {session.device}
                              </span>
                              {session.isCurrent && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{session.browser}</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(session.lastActive)}
                            </p>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <form action={revokeAction}>
                            <input
                              type="hidden"
                              name="sessionId"
                              value={session.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              disabled={isRevoking}
                              className="text-destructive hover:text-destructive"
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    );
                  },
                )}

                {sessions.length > 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="w-full mt-3"
                  >
                    {showAllSessions
                      ? `Show Less`
                      : `See More Sessions (${sessions.length - 5} more)`}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account deletion is permanent and cannot be undone. All your
              recipes, images, and data will be permanently deleted.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers,
                  including:
                  <br />
                  <br />• All your recipes and recipe data
                  <br />• All uploaded images and attachments
                  <br />• Your profile and account information
                  <br />• All settings and preferences
                  <br />
                  <br />
                  If you're sure you want to proceed, we'll send you a
                  confirmation email with instructions to complete the deletion.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Send Deletion Email
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

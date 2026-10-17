"use client";

import { LogOut, Monitor, Smartphone } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSecurityMetrics,
  getUserSessions,
  revokeAllOtherSessions,
  revokeSession,
} from "@/lib/server-actions/session-actions";
import { ButtonVariant } from "@/lib/types";
import type {
  RevokeSessionState,
  SecurityMetrics,
  SessionInfo,
} from "@/lib/types/session-types";
import { formatRelativeDay } from "@/lib/utils/time-formatting";

const VISIBLE_SESSIONS = 5;

function isPhone(device: string): boolean {
  const lower = device.toLowerCase();
  return lower.includes("iphone") || lower.includes("android");
}

export function SecuritySessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [revokeState, revokeAction, isRevoking] = useActionState(
    async (_state: RevokeSessionState, formData: FormData) =>
      await revokeSession(formData),
    null,
  );
  const [revokeAllState, revokeAllAction, isRevokingAll] = useActionState(
    async (_state: RevokeSessionState, _formData: FormData) =>
      await revokeAllOtherSessions(),
    null,
  );

  useEffect(() => {
    Promise.all([
      getUserSessions().catch(() => undefined),
      getSecurityMetrics().catch(() => undefined),
    ]).then(([sessionsResult, metricsResult]) => {
      if (sessionsResult?.success) setSessions(sessionsResult.data);
      if (metricsResult?.success) setMetrics(metricsResult.data);
      if (!sessionsResult?.success && !metricsResult?.success) {
        setError("Your sessions didn't load. Try refreshing the page.");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (revokeState?.success || revokeAllState?.success) {
      getUserSessions().then((result) => {
        if (result.success) setSessions(result.data);
      });
    }
  }, [revokeState, revokeAllState]);

  const feedback = [revokeState, revokeAllState].find(
    (state) => state !== null,
  );
  const visible = showAll ? sessions : sessions.slice(0, VISIBLE_SESSIONS);
  const others = sessions.filter((session) => !session.isCurrent).length;

  return (
    <section
      aria-labelledby="sessions-title"
      className="space-y-4 rounded-tile bg-card p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="sessions-title"
            className="text-xl font-extrabold tracking-[-0.02em]"
          >
            Where you're signed in
          </h3>
          {metrics && (
            <p className="mt-1 text-meta font-normal text-muted-foreground">
              Last sign-in{" "}
              {formatRelativeDay(new Date(metrics.lastLogin)).toLowerCase()} ·
              password changed{" "}
              {formatRelativeDay(
                new Date(metrics.passwordLastChanged),
              ).toLowerCase()}
            </p>
          )}
        </div>
        {others > 0 && (
          <form action={revokeAllAction}>
            <Button
              type="submit"
              variant={ButtonVariant.OUTLINE}
              size="sm"
              disabled={isRevokingAll}
            >
              <LogOut />
              {isRevokingAll ? "Signing out…" : "Sign out everywhere else"}
            </Button>
          </form>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className={
            feedback.success
              ? "rounded-control bg-swatch-herb/20 px-4 py-2.5"
              : "rounded-control bg-destructive/10 px-4 py-2.5 text-destructive"
          }
        >
          {feedback.success ? feedback.message : feedback.error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={`session-row-skeleton-${index}`}
              className="h-16 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-muted-foreground">{error}</p>
      ) : (
        <ul className="divide-y-2 divide-card overflow-hidden rounded-control bg-background">
          {visible.map((session) => {
            const Icon = isPhone(session.device) ? Smartphone : Monitor;
            return (
              <li
                key={session.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Icon
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {session.device} · {session.browser}
                    {session.isCurrent && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-caption text-accent-foreground">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-meta font-normal text-muted-foreground">
                    {session.location} · active{" "}
                    {formatRelativeDay(
                      new Date(session.lastActive),
                    ).toLowerCase()}
                  </p>
                </div>
                {!session.isCurrent && (
                  <form action={revokeAction}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <Button
                      type="submit"
                      variant={ButtonVariant.GHOST}
                      size="sm"
                      disabled={isRevoking}
                    >
                      Sign out
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {sessions.length > VISIBLE_SESSIONS && (
        <Button
          variant={ButtonVariant.GHOST}
          size="sm"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll
            ? "Show fewer"
            : `Show ${sessions.length - VISIBLE_SESSIONS} more`}
        </Button>
      )}
    </section>
  );
}

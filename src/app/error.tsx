"use client";

import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl w-full mx-auto p-8">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-3xl">
                  Something went wrong!
                </CardTitle>
                <Badge variant="destructive" className="text-sm">
                  Error
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                We encountered an unexpected error. Our team has been notified
                and is working on a fix.
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === "development" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-mono text-sm break-all">
                      {error.message}
                    </div>
                    {error.digest && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          ID: {error.digest}
                        </Badge>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={reset}
                variant="default"
                size="lg"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try again
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Link href="/dashboard">
                  <Home className="w-5 h-5" />
                  Go home
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

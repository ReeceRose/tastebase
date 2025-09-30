"use client";

import { ArrowLeft, FileQuestion, Home, Info } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileQuestion className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="mb-2">
              <div className="text-6xl font-bold text-muted-foreground/30 mb-2">
                404
              </div>
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-2xl">Page not found</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  404
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Sorry, we couldn't find the page you're looking for. It might
                have been moved, deleted, or you entered the wrong URL.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go back
              </Button>
              <Button
                asChild
                variant="default"
                className="flex items-center gap-2"
              >
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Go home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

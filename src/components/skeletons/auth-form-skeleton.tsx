import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-full rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3].map((index) => (
            <div key={`auth-field-skeleton-${index}`} className="grid gap-3">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-12 w-full rounded-control" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-control" />
          <Skeleton className="h-11 w-full rounded-control" />
        </div>
        <Skeleton className="mx-auto mt-4 h-4 w-48 rounded-full" />
      </CardContent>
    </Card>
  );
}

export function CreateAccountLinkSkeleton() {
  return (
    <div className="mt-4 flex justify-center">
      <Skeleton className="h-5 w-44 rounded-full" />
    </div>
  );
}

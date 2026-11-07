import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[0, 1, 2].map((index) => (
          <div key={`auth-field-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  );
}

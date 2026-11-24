import { CircleAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PageState({ message, error = false }: { message: string; error?: boolean }) {
  if (error) {
    return (
      <Card role="alert" className="border-red-200">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-red-50">
            <CircleAlert aria-hidden="true" className="size-5 text-red-700" />
          </span>
          <span className="text-sm font-semibold">Something went wrong</span>
          <span className="max-w-md text-sm text-muted-foreground">{message}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="status">
      <CardContent className="flex flex-col gap-3 py-6">
        <span className="sr-only">{message}</span>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-28 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

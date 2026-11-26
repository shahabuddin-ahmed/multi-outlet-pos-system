import type { ReactNode } from 'react';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageStateProps {
  message: string;
  error?: boolean;
  // Shown with an error, when trying again can help
  onRetry?: () => void;
  // Shown while loading, in the shape of what is coming; a spinner when left out
  skeleton?: ReactNode;
}

export function PageState({ message, error = false, onRetry, skeleton }: PageStateProps) {
  if (error) {
    return (
      <Card role="alert" className="border-red-200">
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-red-50">
            <CircleAlert aria-hidden="true" className="size-5 text-red-700" />
          </span>
          <span className="text-sm font-semibold">Something went wrong</span>
          <span className="max-w-md text-sm text-muted-foreground">{message}</span>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (skeleton) {
    return (
      <div role="status">
        <span className="sr-only">{message}</span>
        {skeleton}
      </div>
    );
  }

  return (
    <Card role="status">
      <CardContent className="flex items-center justify-center gap-2.5 py-10 text-sm text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
        {message}
      </CardContent>
    </Card>
  );
}

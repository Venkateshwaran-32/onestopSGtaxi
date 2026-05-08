import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Looks like that route doesn&apos;t exist. Try a search instead.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to search</Link>
      </Button>
    </main>
  );
}

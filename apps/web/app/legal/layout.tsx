import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-12 pt-4 sm:px-8 sm:pt-8">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">OneStopSGTaxi</span>
      </header>
      <article className="prose prose-sm mt-6 max-w-none dark:prose-invert">
        {children}
      </article>
    </main>
  );
}

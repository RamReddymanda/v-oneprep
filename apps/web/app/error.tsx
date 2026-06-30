"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-xl place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-muted">The app hit a graceful error boundary.</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}

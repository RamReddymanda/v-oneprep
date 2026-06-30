import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-xl place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted">The page you are looking for does not exist.</p>
        <LinkButton className="mt-6" href="/dashboard">Go to Dashboard</LinkButton>
      </div>
    </main>
  );
}

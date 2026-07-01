"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await api("/auth/login", {
        method: "POST",
        json: { email: data.get("email"), password: data.get("password") }
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center px-4 py-12">
      <Card className="w-full p-6">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-muted">Use `student@voneprep.local` or `admin@voneprep.local` for the demo.</p>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium">Email<input className="rounded-md border border-line px-3 py-2" name="email" type="email" required /></label>
          <label className="grid gap-2 text-sm font-medium">Password<input className="rounded-md border border-line px-3 py-2" name="password" type="password" required /></label>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted"><input type="checkbox" /> Remember me</label>
            <span className="text-primary">Forgot password?</span>
          </div>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</p>}
          <Button disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
        </form>
        <p className="mt-5 text-sm text-muted">New here? <Link className="font-semibold text-primary" href="/signup">Create account</Link></p>
      </Card>
    </main>
  );
}

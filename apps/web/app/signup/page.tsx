"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setError("Passwords do not match");
      return;
    }
    try {
      await api("/auth/signup", {
        method: "POST",
        json: {
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          password: data.get("password")
        }
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-lg items-center px-4 py-12">
      <Card className="w-full p-6">
        <h1 className="text-2xl font-bold">Create your AeroPath account</h1>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">First Name<input className="rounded-md border border-line px-3 py-2" name="firstName" required /></label>
            <label className="grid gap-2 text-sm font-medium">Last Name<input className="rounded-md border border-line px-3 py-2" name="lastName" required /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium">Email<input className="rounded-md border border-line px-3 py-2" name="email" type="email" required /></label>
          <label className="grid gap-2 text-sm font-medium">Password<input className="rounded-md border border-line px-3 py-2" name="password" type="password" minLength={8} required /></label>
          <label className="grid gap-2 text-sm font-medium">Confirm Password<input className="rounded-md border border-line px-3 py-2" name="confirmPassword" type="password" required /></label>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</p>}
          <Button>Create account</Button>
        </form>
        <p className="mt-5 text-sm text-muted">Already have an account? <Link className="font-semibold text-primary" href="/login">Login</Link></p>
      </Card>
    </main>
  );
}

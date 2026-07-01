"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Payment = {
  id: string;
  amountInr: number;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  screenshotUrl: string;
  referenceNote?: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  plan: { name: string };
};

type Settings = { id: string; qrCodeUrl: string | null };

export default function AdminPaymentsPage() {
  const ready = useRequireAdmin();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [status, setStatus] = useState<"PENDING_REVIEW" | "APPROVED" | "REJECTED">("PENDING_REVIEW");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [settingsData, paymentsData] = await Promise.all([
      api<Settings>("/admin/settings"),
      api<Payment[]>(`/admin/payments?status=${status}`)
    ]);
    setSettings(settingsData);
    setPayments(paymentsData);
  }

  useEffect(() => {
    if (ready) void load().catch((err) => setError(err.message));
  }, [ready, status]);

  async function uploadQrCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api(`/admin/settings/qr-code`, { method: "POST", body: formData });
      setMessage("QR code updated.");
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function approve(payment: Payment) {
    setError("");
    setMessage("");
    try {
      await api(`/admin/payments/${payment.id}/approve`, { method: "POST" });
      setMessage("Payment approved, course unlocked.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function reject(payment: Payment) {
    const reviewNote = window.prompt("Reason for rejection (optional)") ?? undefined;
    setError("");
    setMessage("");
    try {
      await api(`/admin/payments/${payment.id}/reject`, { method: "POST", json: { reviewNote } });
      setMessage("Payment rejected.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Payment Review</h1>
      {error && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {message && <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">QR Code Settings</h2>
        <div className="mt-4 flex flex-wrap items-start gap-6">
          {settings?.qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.qrCodeUrl} alt="Payment QR code" className="h-40 w-40 rounded-md border border-line object-contain" />
          ) : (
            <p className="text-sm text-muted">No QR code uploaded yet.</p>
          )}
          <form className="grid gap-3" onSubmit={uploadQrCode}>
            <input className="text-sm" type="file" name="file" accept="image/png,image/jpeg,image/webp" required />
            <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload QR Code"}</Button>
          </form>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-medium text-muted">Status</span>
        <select
          className="rounded-md border border-line px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="mt-4 grid gap-4">
        {payments.length === 0 && <p className="text-sm text-muted">No payments in this status.</p>}
        {payments.map((payment) => (
          <Card key={payment.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{payment.user.firstName} {payment.user.lastName}</p>
                <p className="text-sm text-muted">{payment.user.email}</p>
                <p className="mt-2 text-sm">{payment.plan.name}</p>
                {payment.referenceNote && <p className="mt-1 text-sm text-muted">Reference: {payment.referenceNote}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(payment.createdAt).toLocaleString()}</p>
              </div>
              <p className="text-xl font-bold">{formatInr(payment.amountInr)}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={payment.screenshotUrl} alt="Payment screenshot" className="h-48 w-auto rounded-md border border-line object-contain" />
              {payment.status === "PENDING_REVIEW" && (
                <div className="flex gap-2">
                  <Button onClick={() => approve(payment)}>Approve</Button>
                  <Button variant="danger" onClick={() => reject(payment)}>Reject</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  priceInr: number;
  finalPriceInr: number;
  discountType: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue: number;
  features: string[];
  courses: Array<{ id: string; title: string }>;
};

type Purchase = { plan: { id: string } };
type Payment = { planId: string; status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" };
type CheckoutInfo = { plan: Plan; qrCodeUrl: string | null };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkout, setCheckout] = useState<CheckoutInfo | null>(null);
  const [referenceNote, setReferenceNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [planData, purchaseData, paymentData] = await Promise.all([
      api<Plan[]>("/plans").catch(() => []),
      api<Purchase[]>("/purchases/me").catch(() => []),
      api<Payment[]>("/payments/me").catch(() => [])
    ]);
    setPlans(planData);
    setPurchases(purchaseData);
    setPayments(paymentData);
  }

  useEffect(() => {
    void load();
  }, []);

  function statusFor(plan: Plan): "UNLOCKED" | "PENDING" | "BUY" {
    if (purchases.some((purchase) => purchase.plan.id === plan.id)) return "UNLOCKED";
    if (payments.some((payment) => payment.planId === plan.id && payment.status === "PENDING_REVIEW")) return "PENDING";
    return "BUY";
  }

  async function openCheckout(plan: Plan) {
    setError("");
    setMessage("");
    try {
      const info = await api<CheckoutInfo>(`/payments/checkout/${plan.id}`);
      setCheckout(info);
      setReferenceNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load checkout details");
    }
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkout) return;
    const form = event.currentTarget;
    const file = (form.elements.namedItem("screenshot") as HTMLInputElement)?.files?.[0];
    if (!file) {
      setError("Please attach a payment screenshot.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upload = await api<{ url: string }>("/uploads/screenshot", { method: "POST", body: formData });
      await api("/payments/submit", {
        method: "POST",
        json: { planId: checkout.plan.id, screenshotUrl: upload.url, referenceNote: referenceNote || undefined }
      });
      setMessage("Submitted — pending admin approval.");
      setCheckout(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="mt-3 text-muted">Choose a DGCA learning plan. Pay via QR code and upload your payment screenshot for admin approval.</p>
      </div>
      {message && <p className="mt-6 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
      {error && !checkout && <p className="mt-6 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const status = statusFor(plan);
          const hasDiscount = plan.discountType !== "NONE" && plan.finalPriceInr !== plan.priceInr;
          return (
            <Card key={plan.id} className="p-6">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {hasDiscount && <Badge className="border-primary/30 bg-primary/10 text-primary">Discount</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted">{plan.courses.map((course) => course.title).join(", ")}</p>
              {hasDiscount ? (
                <div className="mt-6">
                  <p className="text-sm text-muted line-through">{formatInr(plan.priceInr)}</p>
                  <p className="text-3xl font-bold text-primary">{formatInr(plan.finalPriceInr)}</p>
                </div>
              ) : (
                <p className="mt-6 text-3xl font-bold">{formatInr(plan.priceInr)}</p>
              )}
              <ul className="mt-6 grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="text-success" size={16} />{feature}</li>
                ))}
              </ul>
              {status === "UNLOCKED" && <Button className="mt-6 w-full" variant="secondary" disabled>Unlocked</Button>}
              {status === "PENDING" && <Button className="mt-6 w-full" variant="secondary" disabled>Pending review</Button>}
              {status === "BUY" && (
                <Button className="mt-6 w-full" onClick={() => openCheckout(plan)}><CreditCard size={16} /> Buy</Button>
              )}
            </Card>
          );
        })}
      </div>
      {checkout && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold">Scan & Pay</h2>
            <p className="mt-2 text-sm text-muted">Pay {formatInr(checkout.plan.finalPriceInr)} for {checkout.plan.name}, then upload your payment screenshot.</p>
            {checkout.qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={checkout.qrCodeUrl} alt="Payment QR code" className="mx-auto mt-4 h-48 w-48 rounded-md border border-line object-contain" />
            ) : (
              <p className="mt-4 rounded-md border border-dashed border-line p-4 text-center text-sm text-muted">QR code not configured yet. Please contact support.</p>
            )}
            <form className="mt-4 grid gap-3" onSubmit={submitPayment}>
              <label className="text-sm font-medium text-muted">
                Payment screenshot
                <input className="mt-1 w-full text-sm" type="file" name="screenshot" accept="image/png,image/jpeg,image/webp" required />
              </label>
              <label className="text-sm font-medium text-muted">
                Reference / UTR number (optional)
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  value={referenceNote}
                  onChange={(event) => setReferenceNote(event.target.value)}
                />
              </label>
              {error && <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              <div className="mt-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setCheckout(null)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Payment"}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}

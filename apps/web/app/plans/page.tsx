"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";

type Plan = { id: string; name: string; priceInr: number; features: string[]; courses: Array<{ title: string }> };

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<Plan[]>("/plans").then(setPlans).catch(() => setPlans([]));
  }, []);

  async function buy(plan: Plan) {
    setSelected(plan);
    setMessage("");
    await api("/payments/mock-checkout", { method: "POST", json: { planId: plan.id } });
  }

  async function confirm() {
    if (!selected) return;
    await api("/payments/mock-success", { method: "POST", json: { planId: selected.id } });
    setMessage("Payment success. Course unlocked.");
    setSelected(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="mt-3 text-muted">Choose a DGCA learning plan. Payments are mocked for the MVP demo.</p>
      </div>
      {message && <p className="mt-6 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted">{plan.courses.map((course) => course.title).join(", ")}</p>
            <p className="mt-6 text-3xl font-bold">{formatInr(plan.priceInr)}</p>
            <ul className="mt-6 grid gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="text-success" size={16} />{feature}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" onClick={() => buy(plan)}><CreditCard size={16} /> Buy</Button>
          </Card>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold">Mock Razorpay</h2>
            <p className="mt-2 text-sm text-muted">Confirm mock payment for {selected.name} at {formatInr(selected.priceInr)}.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button onClick={confirm}>Payment Success</Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}

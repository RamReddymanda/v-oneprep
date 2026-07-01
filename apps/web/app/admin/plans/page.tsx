"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Course = { id: string; title: string };
type Plan = {
  id: string;
  name: string;
  priceInr: number;
  finalPriceInr: number;
  discountType: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue: number;
  features: string[];
  status: "DRAFT" | "PUBLISHED";
  courses: Course[];
};

const emptyForm = {
  name: "",
  priceInr: "",
  features: "",
  courseIds: [] as string[],
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
  discountType: "NONE" as "NONE" | "PERCENTAGE" | "FIXED",
  discountValue: "0"
};

export default function AdminPlansPage() {
  const ready = useRequireAdmin();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [planData, courseData] = await Promise.all([api<Plan[]>("/admin/plans"), api<Course[]>("/admin/courses")]);
    setPlans(planData);
    setCourses(courseData);
  }

  useEffect(() => {
    if (ready) void load().catch((err) => setError(err.message));
  }, [ready]);

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      priceInr: String(plan.priceInr),
      features: plan.features.join(", "),
      courseIds: plan.courses.map((course) => course.id),
      status: plan.status,
      discountType: plan.discountType,
      discountValue: String(plan.discountValue)
    });
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const courseIds = data.getAll("courseId").map(String);
    const payload = {
      name: String(data.get("name")),
      priceInr: Number(data.get("priceInr")),
      features: String(data.get("features")).split(",").map((item) => item.trim()).filter(Boolean),
      courseIds,
      status: String(data.get("status")),
      discountType: String(data.get("discountType")),
      discountValue: Number(data.get("discountValue") || 0)
    };
    setSubmitting(true);
    try {
      if (editingId) {
        await api(`/admin/plans/${editingId}`, { method: "PATCH", json: payload });
        setMessage("Plan updated");
      } else {
        await api("/admin/plans", { method: "POST", json: payload });
        setMessage("Plan created");
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    setError("");
    setMessage("");
    try {
      await api(`/admin/plans/${plan.id}`, { method: "DELETE" });
      setMessage("Plan deleted");
      if (editingId === plan.id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Plan Management</h1>
      {error && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {message && <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">{editingId ? "Edit Plan" : "Create Plan"}</h2>
          <form className="mt-4 grid gap-3" onSubmit={submitPlan}>
            <input
              className="rounded-md border border-line px-3 py-2"
              name="name"
              placeholder="Plan name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <input
              className="rounded-md border border-line px-3 py-2"
              name="priceInr"
              type="number"
              min={0}
              placeholder="Price INR"
              value={form.priceInr}
              onChange={(event) => setForm({ ...form, priceInr: event.target.value })}
              required
            />
            <input
              className="rounded-md border border-line px-3 py-2"
              name="features"
              placeholder="Videos, Notes, Assessments"
              value={form.features}
              onChange={(event) => setForm({ ...form, features: event.target.value })}
              required
            />
            <label className="text-sm font-medium text-muted">
              Courses (ctrl/cmd-click for multiple)
              <select
                className="mt-1 h-32 w-full rounded-md border border-line px-3 py-2"
                name="courseId"
                multiple
                value={form.courseIds}
                onChange={(event) => setForm({ ...form, courseIds: Array.from(event.target.selectedOptions, (option) => option.value) })}
                required
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-muted">
                Discount type
                <select
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  name="discountType"
                  value={form.discountType}
                  onChange={(event) => setForm({ ...form, discountType: event.target.value as typeof form.discountType })}
                >
                  <option value="NONE">None</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed (INR)</option>
                </select>
              </label>
              <label className="text-sm font-medium text-muted">
                Discount value
                <input
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                  name="discountValue"
                  type="number"
                  min={0}
                  value={form.discountValue}
                  onChange={(event) => setForm({ ...form, discountValue: event.target.value })}
                  disabled={form.discountType === "NONE"}
                />
              </label>
            </div>
            <label className="text-sm font-medium text-muted">
              Status
              <select
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
                name="status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as typeof form.status })}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{editingId ? "Save Changes" : "Create Plan"}</Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">{plan.status}</p>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm text-muted">{plan.courses.map((course) => course.title).join(", ")}</p>
                </div>
                <div className="text-right">
                  {plan.discountType !== "NONE" && plan.finalPriceInr !== plan.priceInr ? (
                    <>
                      <p className="text-sm text-muted line-through">{formatInr(plan.priceInr)}</p>
                      <p className="text-2xl font-bold text-primary">{formatInr(plan.finalPriceInr)}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold">{formatInr(plan.priceInr)}</p>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm text-muted">{plan.features.join(" · ")}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(plan)}>Edit</Button>
                <Button variant="danger" onClick={() => deletePlan(plan)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

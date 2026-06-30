"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";

type Course = { id: string; title: string };
type Plan = { id: string; name: string; priceInr: number; features: string[]; status: string; courses: Course[] };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  async function load() {
    const [planData, courseData] = await Promise.all([api<Plan[]>("/admin/plans"), api<Course[]>("/admin/courses")]);
    setPlans(planData);
    setCourses(courseData);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/plans", {
      method: "POST",
      json: {
        name: data.get("name"),
        priceInr: Number(data.get("priceInr")),
        features: String(data.get("features")).split(",").map((item) => item.trim()).filter(Boolean),
        courseIds: [String(data.get("courseId"))],
        status: "PUBLISHED"
      }
    });
    event.currentTarget.reset();
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Plan Management</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Create Plan</h2>
          <form className="mt-4 grid gap-3" onSubmit={createPlan}>
            <input className="rounded-md border border-line px-3 py-2" name="name" placeholder="Plan name" required />
            <input className="rounded-md border border-line px-3 py-2" name="priceInr" type="number" placeholder="Price INR" required />
            <input className="rounded-md border border-line px-3 py-2" name="features" placeholder="Videos, Notes, Assessments" required />
            <select className="rounded-md border border-line px-3 py-2" name="courseId" required>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <Button>Create Plan</Button>
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
                <p className="text-2xl font-bold">{formatInr(plan.priceInr)}</p>
              </div>
              <p className="mt-4 text-sm text-muted">{plan.features.join(" · ")}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

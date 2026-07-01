"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, IndianRupee, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, LinkButton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatInr } from "@/lib/utils";
import { useRequireAdmin } from "@/lib/use-require-admin";

type Metrics = {
  totalUsers: number;
  totalStudents: number;
  totalCourses: number;
  revenue: number;
  assessmentsTaken: number;
  recentActivity: Array<{ id: string; label: string; createdAt: string }>;
};

export default function AdminPage() {
  const ready = useRequireAdmin();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  useEffect(() => {
    if (ready) api<Metrics>("/admin/metrics").then(setMetrics).catch(() => undefined);
  }, [ready]);
  if (!ready || !metrics) return <main className="mx-auto max-w-7xl px-4 py-10 text-muted">Loading admin dashboard...</main>;
  const cards = [
    ["Total Users", metrics.totalUsers, Users],
    ["Total Students", metrics.totalStudents, Users],
    ["Total Courses", metrics.totalCourses, BookOpen],
    ["Revenue", formatInr(metrics.revenue), IndianRupee],
    ["Assessments Taken", metrics.assessmentsTaken, ClipboardCheck]
  ] as const;
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted">Manage courses, plans, users, and demo readiness.</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/admin/courses" variant="secondary">Courses</LinkButton>
          <LinkButton href="/admin/plans" variant="secondary">Plans</LinkButton>
          <LinkButton href="/admin/payments">Payments</LinkButton>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="p-5">
            <Icon className="text-primary" size={20} />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-5">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="mt-4 divide-y divide-line">
          {metrics.recentActivity.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>{item.label}</span>
              <span className="text-muted">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 flex gap-3 text-sm">
        <Link className="font-semibold text-primary" href="/admin/users">User Management</Link>
        <Link className="font-semibold text-primary" href="/admin/courses">Course Management</Link>
        <Link className="font-semibold text-primary" href="/admin/plans">Plan Management</Link>
        <Link className="font-semibold text-primary" href="/admin/payments">Payment Review</Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, LineChart, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";

type Dashboard = {
  user: { firstName: string; lastName: string };
  purchasedCourses: Array<{ id: string; title: string; description: string; bannerUrl: string; progressPercent: number }>;
  stats: { coursesPurchased: number; completedLessons: number; averageScore: number; currentProgress: number };
  recentAssessments: Array<{ id: string; title: string; score: number; percentage: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api<Dashboard>("/dashboard").then(setData).catch(() => undefined);
  }, []);

  if (!data) return <main className="mx-auto max-w-7xl px-4 py-10 text-muted">Loading dashboard...</main>;

  const stats = [
    ["Courses Purchased", data.stats.coursesPurchased, BookOpen],
    ["Completed Lessons", data.stats.completedLessons, ClipboardCheck],
    ["Average Score", `${data.stats.averageScore}%`, Trophy],
    ["Current Progress", `${data.stats.currentProgress}%`, LineChart]
  ] as const;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h1 className="text-3xl font-bold">Welcome, {data.user.firstName}</h1>
        <p className="mt-2 text-muted">Continue your DGCA preparation from the next task.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label} className="p-5">
            <Icon className="text-primary" size={20} />
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Card>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Purchased Courses</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {data.purchasedCourses.length === 0 && <EmptyState title="No courses yet" body="Buy a plan to unlock your learning dashboard." />}
          {data.purchasedCourses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="overflow-hidden transition hover:shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="h-48 w-full object-cover" src={course.bannerUrl} alt="" />
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{course.description}</p>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm"><span>Progress</span><span>{course.progressPercent}%</span></div>
                    <ProgressBar value={course.progressPercent} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Recent Assessments</h2>
        <div className="mt-4 grid gap-3">
          {data.recentAssessments.length === 0 ? (
            <EmptyState title="No attempts yet" body="Your assessment scores will appear here." />
          ) : (
            data.recentAssessments.map((attempt) => (
              <Card key={attempt.id} className="flex items-center justify-between p-4">
                <span className="font-medium">{attempt.title}</span>
                <span className="text-sm text-muted">{attempt.score} correct · {attempt.percentage}%</span>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

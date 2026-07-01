"use client";

import Link from "next/link";
import { CheckCircle2, Circle, FileText, Lock, PlayCircle, Timer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";

type Course = {
  title: string;
  description: string;
  bannerUrl: string;
  progressPercent: number;
  estimatedDurationMinutes: number;
  modules: Array<{ id: string; title: string; description: string; tasks: Array<{ id: string; title: string; type: string; durationMinutes: number; completed: boolean; locked: boolean }> }>;
};

const icons = { VIDEO: PlayCircle, ARTICLE: FileText, ASSESSMENT: Timer } as const;

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    api<Course>(`/courses/${params.courseId}`).then(setCourse).catch(() => undefined);
  }, [params.courseId]);

  if (!course) return <main className="mx-auto max-w-7xl px-4 py-10 text-muted">Loading course...</main>;

  return (
    <main>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <Badge>{course.modules.length} modules · {course.estimatedDurationMinutes} min</Badge>
            <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
            <p className="mt-3 max-w-3xl text-muted">{course.description}</p>
            <div className="mt-6 max-w-xl">
              <div className="mb-2 flex justify-between text-sm"><span>Overall Progress</span><span>{course.progressPercent}%</span></div>
              <ProgressBar value={course.progressPercent} />
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="h-56 w-full rounded-lg object-cover" src={course.bannerUrl} alt="" />
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold">Course Structure</h2>
        <div className="mt-5 grid gap-5">
          {course.modules.map((module) => (
            <Card key={module.id} className="p-5">
              <h3 className="text-lg font-semibold">{module.title}</h3>
              <p className="mt-1 text-sm text-muted">{module.description}</p>
              <div className="mt-5 divide-y divide-line">
                {module.tasks.map((task) => {
                  const Icon = icons[task.type as keyof typeof icons] ?? Circle;
                  const statusIcon = task.locked ? <Lock size={16} /> : task.completed ? <CheckCircle2 className="text-success" size={16} /> : <Circle size={16} />;
                  return (
                    <Link key={task.id} className="flex items-center justify-between gap-4 py-4 hover:text-primary" href={`/learn/${task.id}`}>
                      <span className="flex min-w-0 items-center gap-3"><Icon size={18} /><span className="truncate font-medium">{task.title}</span></span>
                      <span className="flex shrink-0 items-center gap-3 text-sm text-muted">{task.durationMinutes} min {statusIcon}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

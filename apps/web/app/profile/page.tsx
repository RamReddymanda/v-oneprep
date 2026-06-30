"use client";

import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";

type Profile = {
  user: { firstName: string; lastName: string; email: string; joinedAt: string };
  stats: { coursesPurchased: number; completedLessons: number; averageScore: number; currentProgress: number };
  purchasedCourses: Array<{ id: string; title: string; progressPercent: number }>;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    api<Profile>("/profile").then(setProfile).catch(() => undefined);
  }, []);
  if (!profile) return <main className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading profile...</main>;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white"><UserRound /></span>
          <div>
            <h1 className="text-2xl font-bold">{profile.user.firstName} {profile.user.lastName}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted"><Mail size={15} />{profile.user.email}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted"><CalendarDays size={15} />Joined {new Date(profile.user.joinedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(profile.stats).map(([key, value]) => (
          <Card key={key} className="p-5">
            <p className="text-2xl font-bold">{value}{key.toLowerCase().includes("score") || key.toLowerCase().includes("progress") ? "%" : ""}</p>
            <p className="mt-1 text-sm capitalize text-muted">{key.replace(/[A-Z]/g, " $&")}</p>
          </Card>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Purchased Courses</h2>
        <div className="mt-4 grid gap-3">
          {profile.purchasedCourses.map((course) => (
            <Card key={course.id} className="p-4">
              <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{course.title}</span><span>{course.progressPercent}%</span></div>
              <ProgressBar value={course.progressPercent} />
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { api } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { useRequireAdmin } from "@/lib/use-require-admin";
import { useAdminCourses } from "@/lib/use-admin-courses";
import type { AdminCourse } from "@/lib/admin-courses-types";

export default function AdminCoursesPage() {
  const ready = useRequireAdmin();
  const { courses, loading, error: loadError, reload } = useAdminCourses(ready);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [courseSlugTouched, setCourseSlugTouched] = useState(false);

  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

  function clearBanners() {
    setError("");
    setMessage("");
  }

  async function withHandling(action: () => Promise<void>, successMessage: string) {
    clearBanners();
    try {
      await action();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await withHandling(async () => {
      await api("/admin/courses", {
        method: "POST",
        json: {
          title: data.get("title"),
          slug: data.get("slug"),
          description: data.get("description"),
          bannerUrl: data.get("bannerUrl"),
          estimatedDurationMinutes: Number(data.get("estimatedDurationMinutes")),
          status: "DRAFT"
        }
      });
      form.reset();
      setCourseTitle("");
      setCourseSlug("");
      setCourseSlugTouched(false);
      await reload();
    }, "Course created.");
  }

  async function saveCourseEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCourse) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/courses/${editingCourse.id}`, {
        method: "PATCH",
        json: {
          title: data.get("title"),
          slug: data.get("slug"),
          description: data.get("description"),
          bannerUrl: data.get("bannerUrl"),
          estimatedDurationMinutes: Number(data.get("estimatedDurationMinutes")),
          status: data.get("status")
        }
      });
      setEditingCourse(null);
      await reload();
    }, "Course updated.");
  }

  async function deleteCourse(course: AdminCourse) {
    const taskCount = course.modules.reduce((total, module) => total + module.tasks.length, 0);
    if (!confirm(`Delete "${course.title}"? This will also delete ${course.modules.length} module(s) and ${taskCount} lesson(s).`)) return;
    await withHandling(async () => {
      await api(`/admin/courses/${course.id}`, { method: "DELETE" });
      await reload();
    }, "Course deleted.");
  }

  async function publish(id: string, current: string) {
    await withHandling(async () => {
      await api(`/admin/courses/${id}/${current === "PUBLISHED" ? "unpublish" : "publish"}`, { method: "POST" });
      await reload();
    }, current === "PUBLISHED" ? "Course unpublished." : "Course published.");
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="mt-2 text-muted">Create a course, then open it to manage its modules, lessons, and content.</p>
        </div>
      </div>
      {(error || loadError) && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error || loadError}</p>}
      {message && <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}

      <Card className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Create Course</h2>
        <form className="mt-4 grid gap-3" onSubmit={createCourse}>
          <input
            className="rounded-md border border-line px-3 py-2"
            name="title"
            placeholder="Title"
            value={courseTitle}
            onChange={(event) => {
              setCourseTitle(event.target.value);
              if (!courseSlugTouched) setCourseSlug(slugify(event.target.value));
            }}
            required
          />
          <input
            className="rounded-md border border-line px-3 py-2"
            name="slug"
            placeholder="slug"
            value={courseSlug}
            onChange={(event) => {
              setCourseSlugTouched(true);
              setCourseSlug(event.target.value);
            }}
            required
          />
          <textarea className="min-h-24 rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
          <input className="rounded-md border border-line px-3 py-2" name="bannerUrl" placeholder="Banner URL" required />
          <input className="rounded-md border border-line px-3 py-2" name="estimatedDurationMinutes" type="number" placeholder="Duration minutes" required />
          <Button>Create</Button>
        </form>
      </Card>

      <div className="mt-6 grid gap-4">
        {!loading && courses.length === 0 && <EmptyState title="No courses" body="Create the first DGCA course." />}
        {courses.map((course) => {
          const taskCount = course.modules.reduce((total, module) => total + module.tasks.length, 0);
          return (
            <Card key={course.id} className="p-5">
              {editingCourse?.id === course.id ? (
                <form className="grid gap-3" onSubmit={saveCourseEdit}>
                  <input className="rounded-md border border-line px-3 py-2" name="title" defaultValue={course.title} required />
                  <input className="rounded-md border border-line px-3 py-2" name="slug" defaultValue={course.slug} required />
                  <textarea className="min-h-24 rounded-md border border-line px-3 py-2" name="description" defaultValue={course.description} required />
                  <input className="rounded-md border border-line px-3 py-2" name="bannerUrl" defaultValue={course.bannerUrl} required />
                  <input className="rounded-md border border-line px-3 py-2" name="estimatedDurationMinutes" type="number" defaultValue={course.estimatedDurationMinutes} required />
                  <select className="rounded-md border border-line px-3 py-2" name="status" defaultValue={course.status} required>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">{course.status}</p>
                    <h2 className="text-xl font-semibold">{course.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-muted">{course.description}</p>
                    <p className="mt-2 text-xs text-muted">{course.modules.length} module(s) · {taskCount} lesson(s) · {course.estimatedDurationMinutes} min</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LinkButton href={`/admin/courses/${course.id}`}>Manage Curriculum</LinkButton>
                    <Button variant="secondary" onClick={() => publish(course.id, course.status)}>
                      {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingCourse(course)}>Edit</Button>
                    <Button variant="danger" onClick={() => deleteCourse(course)}>Delete</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}

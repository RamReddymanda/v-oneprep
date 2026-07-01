"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { api } from "@/lib/api";
import { useRequireAdmin } from "@/lib/use-require-admin";
import { useAdminCourses } from "@/lib/use-admin-courses";
import type { AdminModule } from "@/lib/admin-courses-types";

export default function AdminCourseDetailPage() {
  const ready = useRequireAdmin();
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, loading, error: loadError, reload } = useAdminCourses(ready);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingCourse, setEditingCourse] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModule | null>(null);

  const course = courses.find((item) => item.id === courseId);

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

  async function saveCourseEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/courses/${course.id}`, {
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
      setEditingCourse(false);
      await reload();
    }, "Course updated.");
  }

  async function createModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!course) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    await withHandling(async () => {
      await api("/admin/modules", {
        method: "POST",
        json: {
          courseId: course.id,
          title: data.get("title"),
          description: data.get("description"),
          position: Number(data.get("position"))
        }
      });
      form.reset();
      await reload();
    }, "Module created.");
  }

  async function saveModuleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingModule) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/modules/${editingModule.id}`, {
        method: "PATCH",
        json: {
          title: data.get("title"),
          description: data.get("description"),
          position: Number(data.get("position"))
        }
      });
      setEditingModule(null);
      await reload();
    }, "Module updated.");
  }

  async function deleteModule(module: AdminModule) {
    if (!confirm(`Delete module "${module.title}"? This will also delete ${module.tasks.length} lesson(s).`)) return;
    await withHandling(async () => {
      await api(`/admin/modules/${module.id}`, { method: "DELETE" });
      await reload();
    }, "Module deleted.");
  }

  if (!ready) return null;
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading...</main>;

  if (!course) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Courses", href: "/admin/courses" }, { label: "Not found" }]} />
        <div className="mt-6">
          <EmptyState title="Course not found" body="It may have been deleted. Go back to the course list." />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Courses", href: "/admin/courses" }, { label: course.title }]} />
      {(error || loadError) && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error || loadError}</p>}
      {message && <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}

      <Card className="mt-6 p-5">
        {editingCourse ? (
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
              <Button type="button" variant="secondary" onClick={() => setEditingCourse(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{course.status}</p>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">{course.description}</p>
            </div>
            <Button variant="secondary" onClick={() => setEditingCourse(true)}>Edit Course Details</Button>
          </div>
        )}
      </Card>

      <h2 className="mt-8 text-xl font-semibold">Modules</h2>
      <p className="mt-1 text-sm text-muted">Open a module to manage its lessons (videos, reading material, assessments).</p>

      <Card className="mt-4 p-5">
        <h3 className="text-base font-semibold">Add Module</h3>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_120px_auto]" onSubmit={createModule}>
          <input className="rounded-md border border-line px-3 py-2" name="title" placeholder="Module title" required />
          <input className="rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
          <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" defaultValue={course.modules.length} required />
          <Button>Add Module</Button>
        </form>
      </Card>

      <div className="mt-4 grid gap-3">
        {course.modules.length === 0 && <EmptyState title="No modules yet" body="Add the first module above to start building this course's curriculum." />}
        {course.modules.map((module) => (
          <Card key={module.id} className="p-5">
            {editingModule?.id === module.id ? (
              <form className="grid gap-2" onSubmit={saveModuleEdit}>
                <input className="rounded-md border border-line px-3 py-2" name="title" defaultValue={module.title} required />
                <input className="rounded-md border border-line px-3 py-2" name="description" defaultValue={module.description} required />
                <input className="rounded-md border border-line px-3 py-2" name="position" type="number" defaultValue={module.position} required />
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingModule(null)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{module.title}</p>
                  <p className="mt-1 text-sm text-muted">{module.description}</p>
                  <p className="mt-1 text-xs text-muted">{module.tasks.length} lesson(s)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/admin/courses/${course.id}/modules/${module.id}`}>Manage Lessons</LinkButton>
                  <Button variant="secondary" onClick={() => setEditingModule(module)}>Edit</Button>
                  <Button variant="danger" onClick={() => deleteModule(module)}>Delete</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}

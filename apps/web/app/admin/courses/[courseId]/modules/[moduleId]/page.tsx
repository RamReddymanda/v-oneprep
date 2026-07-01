"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Breadcrumbs, Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { api } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { useRequireAdmin } from "@/lib/use-require-admin";
import { useAdminCourses } from "@/lib/use-admin-courses";
import type { AdminTask } from "@/lib/admin-courses-types";

export default function AdminModuleDetailPage() {
  const ready = useRequireAdmin();
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const { courses, loading, error: loadError, reload } = useAdminCourses(ready);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingModule, setEditingModule] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskSlug, setTaskSlug] = useState("");
  const [taskSlugTouched, setTaskSlugTouched] = useState(false);
  const [taskType, setTaskType] = useState("VIDEO");

  const course = courses.find((item) => item.id === courseId);
  const courseModule = course?.modules.find((item) => item.id === moduleId);

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

  async function saveModuleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseModule) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/modules/${courseModule.id}`, {
        method: "PATCH",
        json: {
          title: data.get("title"),
          description: data.get("description"),
          position: Number(data.get("position"))
        }
      });
      setEditingModule(false);
      await reload();
    }, "Module updated.");
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseModule) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    await withHandling(async () => {
      await api("/admin/tasks", {
        method: "POST",
        json: {
          moduleId: courseModule.id,
          title: data.get("title"),
          slug: data.get("slug"),
          type: data.get("type"),
          description: data.get("description"),
          position: Number(data.get("position")),
          durationMinutes: Number(data.get("durationMinutes")),
          status: data.get("status"),
          vimeoUrl: data.get("vimeoUrl") || undefined,
          thumbnailUrl: data.get("thumbnailUrl") || undefined
        }
      });
      form.reset();
      setTaskTitle("");
      setTaskSlug("");
      setTaskSlugTouched(false);
      setTaskType("VIDEO");
      await reload();
    }, "Lesson created.");
  }

  async function saveTaskEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/tasks/${editingTask.id}`, {
        method: "PATCH",
        json: {
          title: data.get("title"),
          slug: data.get("slug"),
          type: editingTask.type,
          description: data.get("description"),
          position: Number(data.get("position")),
          durationMinutes: Number(data.get("durationMinutes")),
          status: data.get("status"),
          vimeoUrl: data.get("vimeoUrl") || undefined,
          thumbnailUrl: data.get("thumbnailUrl") || undefined
        }
      });
      setEditingTask(null);
      await reload();
    }, "Lesson updated.");
  }

  async function deleteTask(task: AdminTask) {
    if (!confirm(`Delete lesson "${task.title}"? This will also delete its content.`)) return;
    await withHandling(async () => {
      await api(`/admin/tasks/${task.id}`, { method: "DELETE" });
      await reload();
    }, "Lesson deleted.");
  }

  if (!ready) return null;
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading...</main>;

  if (!course || !courseModule) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Courses", href: "/admin/courses" }, { label: "Not found" }]} />
        <div className="mt-6">
          <EmptyState title="Module not found" body="It may have been deleted. Go back to the course." />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: courseModule.title }
        ]}
      />
      {(error || loadError) && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error || loadError}</p>}
      {message && <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}

      <Card className="mt-6 p-5">
        {editingModule ? (
          <form className="grid gap-3" onSubmit={saveModuleEdit}>
            <input className="rounded-md border border-line px-3 py-2" name="title" defaultValue={courseModule.title} required />
            <input className="rounded-md border border-line px-3 py-2" name="description" defaultValue={courseModule.description} required />
            <input className="rounded-md border border-line px-3 py-2" name="position" type="number" defaultValue={courseModule.position} required />
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingModule(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{courseModule.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">{courseModule.description}</p>
            </div>
            <Button variant="secondary" onClick={() => setEditingModule(true)}>Edit Module Details</Button>
          </div>
        )}
      </Card>

      <h2 className="mt-8 text-xl font-semibold">Lessons</h2>
      <p className="mt-1 text-sm text-muted">Open a lesson to edit its video, reading material, or assessment content.</p>

      <Card className="mt-4 p-5">
        <h3 className="text-base font-semibold">Add Lesson</h3>
        <form className="mt-3 grid gap-3" onSubmit={createTask}>
          <input
            className="rounded-md border border-line px-3 py-2"
            name="title"
            placeholder="Lesson title"
            value={taskTitle}
            onChange={(event) => {
              setTaskTitle(event.target.value);
              if (!taskSlugTouched) setTaskSlug(slugify(event.target.value));
            }}
            required
          />
          <input
            className="rounded-md border border-line px-3 py-2"
            name="slug"
            placeholder="lesson-slug"
            value={taskSlug}
            onChange={(event) => {
              setTaskSlugTouched(true);
              setTaskSlug(event.target.value);
            }}
            required
          />
          <select className="rounded-md border border-line px-3 py-2" name="type" value={taskType} onChange={(event) => setTaskType(event.target.value)} required>
            <option value="VIDEO">Video</option>
            <option value="ARTICLE">Reading Material</option>
            <option value="ASSESSMENT">Assessment</option>
          </select>
          <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" defaultValue={courseModule.tasks.length} required />
            <input className="rounded-md border border-line px-3 py-2" name="durationMinutes" type="number" placeholder="Minutes" required />
            <select className="rounded-md border border-line px-3 py-2" name="status" required>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          {taskType === "VIDEO" && (
            <>
              <input className="rounded-md border border-line px-3 py-2" name="vimeoUrl" placeholder="Vimeo embed URL" />
              <input className="rounded-md border border-line px-3 py-2" name="thumbnailUrl" placeholder="Thumbnail URL" />
            </>
          )}
          <Button>Add Lesson</Button>
        </form>
      </Card>

      <div className="mt-4 grid gap-3">
        {courseModule.tasks.length === 0 && <EmptyState title="No lessons yet" body="Add the first lesson above." />}
        {courseModule.tasks.map((task) => (
          <Card key={task.id} className="p-5">
            {editingTask?.id === task.id ? (
              <form className="grid gap-2" onSubmit={saveTaskEdit}>
                <input className="rounded-md border border-line px-3 py-2" name="title" defaultValue={task.title} required />
                <input className="rounded-md border border-line px-3 py-2" name="slug" defaultValue={task.slug} required />
                <select className="rounded-md border border-line bg-surface px-3 py-2 text-muted" defaultValue={task.type} disabled>
                  <option value="VIDEO">Video</option>
                  <option value="ARTICLE">Reading Material</option>
                  <option value="ASSESSMENT">Assessment</option>
                </select>
                <p className="text-xs text-muted">Type cannot be changed after creation — delete and recreate the lesson for a different type.</p>
                <textarea className="min-h-16 rounded-md border border-line px-3 py-2" name="description" defaultValue={task.description} required />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="rounded-md border border-line px-3 py-2" name="position" type="number" defaultValue={task.position} required />
                  <input className="rounded-md border border-line px-3 py-2" name="durationMinutes" type="number" defaultValue={task.durationMinutes} required />
                  <select className="rounded-md border border-line px-3 py-2" name="status" defaultValue={task.status} required>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                {task.type === "VIDEO" && (
                  <>
                    <input className="rounded-md border border-line px-3 py-2" name="vimeoUrl" defaultValue={task.vimeoUrl ?? ""} placeholder="Vimeo embed URL" />
                    <input className="rounded-md border border-line px-3 py-2" name="thumbnailUrl" defaultValue={task.thumbnailUrl ?? ""} placeholder="Thumbnail URL" />
                  </>
                )}
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingTask(null)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge>{task.type}</Badge>
                    <Badge>{task.status}</Badge>
                    <Badge>{task.durationMinutes} min</Badge>
                    {task.type === "ARTICLE" && <Badge className={task.article ? "border-success/30 bg-success/10 text-success" : ""}>{task.article ? "Content added" : "No content yet"}</Badge>}
                    {task.type === "ASSESSMENT" && <Badge className={task.assessment ? "border-success/30 bg-success/10 text-success" : ""}>{task.assessment ? `${task.assessment.questions.length} question(s)` : "Not configured"}</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/admin/courses/${course.id}/modules/${courseModule.id}/tasks/${task.id}`}>Edit Content</LinkButton>
                  <Button variant="secondary" onClick={() => setEditingTask(task)}>Edit</Button>
                  <Button variant="danger" onClick={() => deleteTask(task)}>Delete</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}

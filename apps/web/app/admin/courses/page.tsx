"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, EmptyState } from "@/components/ui";
import { RichTextEditor } from "@/components/rich-text-editor";
import { api } from "@/lib/api";

type Task = {
  id: string;
  title: string;
  type: "VIDEO" | "ARTICLE" | "ASSESSMENT";
  status: string;
  article?: { id: string } | null;
  assessment?: { id: string; questions: Array<{ id: string; prompt: string }> } | null;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  estimatedDurationMinutes: number;
  status: string;
  modules: Array<{ id: string; title: string; description: string; tasks: Task[] }>;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState("");
  const [articleContent, setArticleContent] = useState<unknown>({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Write clear aviation study material." }] }]
  });

  const allModules = useMemo(() => courses.flatMap((course) => course.modules.map((module) => ({ ...module, courseTitle: course.title }))), [courses]);
  const articleTasks = useMemo(() => allModules.flatMap((module) => module.tasks.filter((task) => task.type === "ARTICLE")), [allModules]);
  const assessmentTasks = useMemo(() => allModules.flatMap((module) => module.tasks.filter((task) => task.type === "ASSESSMENT")), [allModules]);
  const assessments = useMemo(() => assessmentTasks.flatMap((task) => (task.assessment ? [{ ...task.assessment, taskTitle: task.title }] : [])), [assessmentTasks]);

  async function load() {
    setCourses(await api<Course[]>("/admin/courses"));
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
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
    setMessage("Course created.");
    event.currentTarget.reset();
    await load();
  }

  async function createModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/modules", {
      method: "POST",
      json: {
        courseId: data.get("courseId"),
        title: data.get("title"),
        description: data.get("description"),
        position: Number(data.get("position"))
      }
    });
    setMessage("Module created.");
    event.currentTarget.reset();
    await load();
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/tasks", {
      method: "POST",
      json: {
        moduleId: data.get("moduleId"),
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
    setMessage("Task created.");
    event.currentTarget.reset();
    await load();
  }

  async function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/articles", {
      method: "POST",
      json: {
        taskId: data.get("taskId"),
        coverImageUrl: data.get("coverImageUrl"),
        estimatedReadingMinutes: Number(data.get("estimatedReadingMinutes")),
        content: articleContent
      }
    });
    setMessage("Article saved.");
    await load();
  }

  async function createAssessment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/assessments", {
      method: "POST",
      json: {
        taskId: data.get("taskId"),
        instructions: data.get("instructions"),
        timerMinutes: Number(data.get("timerMinutes")),
        passingScore: Number(data.get("passingScore"))
      }
    });
    setMessage("Assessment saved.");
    event.currentTarget.reset();
    await load();
  }

  async function createQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await api("/admin/questions", {
      method: "POST",
      json: {
        assessmentId: data.get("assessmentId"),
        type: data.get("type"),
        prompt: data.get("prompt"),
        options: String(data.get("options") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
        correctAnswer: data.get("correctAnswer"),
        explanation: data.get("explanation"),
        difficulty: data.get("difficulty"),
        position: Number(data.get("position"))
      }
    });
    setMessage("Question added.");
    event.currentTarget.reset();
    await load();
  }

  async function publish(id: string, current: string) {
    await api(`/admin/courses/${id}/${current === "PUBLISHED" ? "unpublish" : "publish"}`, { method: "POST" });
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="mt-2 text-muted">Create courses, modules, video lessons, reading material, assessments, and questions.</p>
        </div>
        {message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="grid gap-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Create Course</h2>
            <form className="mt-4 grid gap-3" onSubmit={createCourse}>
              <input className="rounded-md border border-line px-3 py-2" name="title" placeholder="Title" required />
              <input className="rounded-md border border-line px-3 py-2" name="slug" placeholder="slug" required />
              <textarea className="min-h-24 rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
              <input className="rounded-md border border-line px-3 py-2" name="bannerUrl" placeholder="Banner URL" required />
              <input className="rounded-md border border-line px-3 py-2" name="estimatedDurationMinutes" type="number" placeholder="Duration minutes" required />
              <Button>Create</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Create Module</h2>
            <form className="mt-4 grid gap-3" onSubmit={createModule}>
              <select className="rounded-md border border-line px-3 py-2" name="courseId" required>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <input className="rounded-md border border-line px-3 py-2" name="title" placeholder="Module title" required />
              <input className="rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
              <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" required />
              <Button>Create Module</Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold">Create Task</h2>
            <form className="mt-4 grid gap-3" onSubmit={createTask}>
              <select className="rounded-md border border-line px-3 py-2" name="moduleId" required>
                {allModules.map((module) => <option key={module.id} value={module.id}>{module.courseTitle} / {module.title}</option>)}
              </select>
              <input className="rounded-md border border-line px-3 py-2" name="title" placeholder="Task title" required />
              <input className="rounded-md border border-line px-3 py-2" name="slug" placeholder="task-slug" required />
              <select className="rounded-md border border-line px-3 py-2" name="type" required>
                <option value="VIDEO">Video</option>
                <option value="ARTICLE">Article</option>
                <option value="ASSESSMENT">Assessment</option>
              </select>
              <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="description" placeholder="Description" required />
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" required />
                <input className="rounded-md border border-line px-3 py-2" name="durationMinutes" type="number" placeholder="Minutes" required />
                <select className="rounded-md border border-line px-3 py-2" name="status" required>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <input className="rounded-md border border-line px-3 py-2" name="vimeoUrl" placeholder="Vimeo embed URL for video task" />
              <input className="rounded-md border border-line px-3 py-2" name="thumbnailUrl" placeholder="Thumbnail URL" />
              <Button>Create Task</Button>
            </form>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">Reading Material</h2>
            <form className="mt-4 grid gap-3" onSubmit={saveArticle}>
              <select className="rounded-md border border-line px-3 py-2" name="taskId" required>
                {articleTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
              <input className="rounded-md border border-line px-3 py-2" name="coverImageUrl" placeholder="Cover image URL" required />
              <input className="rounded-md border border-line px-3 py-2" name="estimatedReadingMinutes" type="number" placeholder="Estimated reading minutes" required />
              <RichTextEditor onChange={setArticleContent} />
              <Button>Save Article</Button>
            </form>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Assessment</h2>
              <form className="mt-4 grid gap-3" onSubmit={createAssessment}>
                <select className="rounded-md border border-line px-3 py-2" name="taskId" required>
                  {assessmentTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                </select>
                <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="instructions" placeholder="Instructions" required />
                <input className="rounded-md border border-line px-3 py-2" name="timerMinutes" type="number" placeholder="Timer minutes" required />
                <input className="rounded-md border border-line px-3 py-2" name="passingScore" type="number" placeholder="Passing score %" required />
                <Button>Save Assessment</Button>
              </form>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold">Question Builder</h2>
              <form className="mt-4 grid gap-3" onSubmit={createQuestion}>
                <select className="rounded-md border border-line px-3 py-2" name="assessmentId" required>
                  {assessments.map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.taskTitle}</option>)}
                </select>
                <select className="rounded-md border border-line px-3 py-2" name="type" required>
                  <option value="MCQ">MCQ</option>
                  <option value="FILL_BLANK">Fill Blank</option>
                </select>
                <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="prompt" placeholder="Question" required />
                <input className="rounded-md border border-line px-3 py-2" name="options" placeholder="Options comma-separated for MCQ" />
                <input className="rounded-md border border-line px-3 py-2" name="correctAnswer" placeholder="Correct answer" required />
                <input className="rounded-md border border-line px-3 py-2" name="explanation" placeholder="Explanation" required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-md border border-line px-3 py-2" name="difficulty" placeholder="Difficulty" required />
                  <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" required />
                </div>
                <Button>Add Question</Button>
              </form>
            </Card>
          </div>

          <div className="grid gap-4">
            {courses.length === 0 && <EmptyState title="No courses" body="Create the first DGCA course." />}
            {courses.map((course) => (
              <Card key={course.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">{course.status}</p>
                    <h2 className="text-xl font-semibold">{course.title}</h2>
                    <p className="mt-2 max-w-3xl text-sm text-muted">{course.description}</p>
                  </div>
                  <Button variant="secondary" onClick={() => publish(course.id, course.status)}>
                    {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </Button>
                </div>
                <div className="mt-5 grid gap-3">
                  {course.modules.map((module) => (
                    <div key={module.id} className="rounded-md bg-surface p-3">
                      <p className="font-medium">{module.title}</p>
                      <div className="mt-2 grid gap-2">
                        {module.tasks.map((task) => (
                          <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm">
                            <span>{task.title}</span>
                            <span className="text-muted">
                              {task.type} · {task.status}
                              {task.article ? " · article" : ""}
                              {task.assessment ? ` · ${task.assessment.questions.length} questions` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

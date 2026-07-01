"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Content } from "@tiptap/react";
import { Badge, Breadcrumbs, Button, Card, EmptyState } from "@/components/ui";
import { RichTextEditor } from "@/components/rich-text-editor";
import { api } from "@/lib/api";
import { useRequireAdmin } from "@/lib/use-require-admin";
import { useAdminCourses } from "@/lib/use-admin-courses";
import type { AdminQuestion } from "@/lib/admin-courses-types";

const DEFAULT_ARTICLE_CONTENT: Content = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Write clear, exam-focused reading material here." }] }]
};

function parseOptions(raw: FormDataEntryValue | null) {
  return String(raw ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function mcqAnswerError(type: string, options: string[], correctAnswer: string) {
  if (type === "MCQ" && !options.includes(correctAnswer)) {
    return "Correct answer must exactly match one of the options.";
  }
  return null;
}

export default function AdminTaskDetailPage() {
  const ready = useRequireAdmin();
  const { courseId, moduleId, taskId } = useParams<{ courseId: string; moduleId: string; taskId: string }>();
  const { courses, loading, error: loadError, reload } = useAdminCourses(ready);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingBasic, setEditingBasic] = useState(false);
  const [articleContent, setArticleContent] = useState<Content>(DEFAULT_ARTICLE_CONTENT);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);

  const course = courses.find((item) => item.id === courseId);
  const courseModule = course?.modules.find((item) => item.id === moduleId);
  const task = courseModule?.tasks.find((item) => item.id === taskId);

  useEffect(() => {
    if (task) setArticleContent((task.article?.content as Content) ?? DEFAULT_ARTICLE_CONTENT);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only resync when navigating to a different task, not on every reload() of the same task
  }, [task?.id]);

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

  async function saveTaskBasic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api(`/admin/tasks/${task.id}`, {
        method: "PATCH",
        json: {
          title: data.get("title"),
          slug: data.get("slug"),
          type: task.type,
          description: data.get("description"),
          position: Number(data.get("position")),
          durationMinutes: Number(data.get("durationMinutes")),
          status: data.get("status"),
          vimeoUrl: data.get("vimeoUrl") || undefined,
          thumbnailUrl: data.get("thumbnailUrl") || undefined
        }
      });
      setEditingBasic(false);
      await reload();
    }, "Lesson details updated.");
  }

  async function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api("/admin/articles", {
        method: "POST",
        json: {
          taskId: task.id,
          coverImageUrl: data.get("coverImageUrl"),
          estimatedReadingMinutes: Number(data.get("estimatedReadingMinutes")),
          content: articleContent
        }
      });
      await reload();
    }, "Reading material saved.");
  }

  async function saveAssessmentSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;
    const data = new FormData(event.currentTarget);
    await withHandling(async () => {
      await api("/admin/assessments", {
        method: "POST",
        json: {
          taskId: task.id,
          instructions: data.get("instructions"),
          timerMinutes: Number(data.get("timerMinutes")),
          passingScore: Number(data.get("passingScore"))
        }
      });
      await reload();
    }, "Assessment settings saved.");
  }

  async function createQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task?.assessment) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("type"));
    const options = parseOptions(data.get("options"));
    const correctAnswer = String(data.get("correctAnswer") ?? "");
    const validationError = mcqAnswerError(type, options, correctAnswer);
    if (validationError) {
      clearBanners();
      setError(validationError);
      return;
    }
    await withHandling(async () => {
      await api("/admin/questions", {
        method: "POST",
        json: {
          assessmentId: task.assessment!.id,
          type,
          prompt: data.get("prompt"),
          options,
          correctAnswer,
          explanation: data.get("explanation"),
          difficulty: data.get("difficulty"),
          position: Number(data.get("position"))
        }
      });
      form.reset();
      await reload();
    }, "Question added.");
  }

  async function saveQuestionEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingQuestion) return;
    const data = new FormData(event.currentTarget);
    const type = String(data.get("type"));
    const options = parseOptions(data.get("options"));
    const correctAnswer = String(data.get("correctAnswer") ?? "");
    const validationError = mcqAnswerError(type, options, correctAnswer);
    if (validationError) {
      clearBanners();
      setError(validationError);
      return;
    }
    await withHandling(async () => {
      await api(`/admin/questions/${editingQuestion.id}`, {
        method: "PATCH",
        json: {
          assessmentId: editingQuestion.assessmentId,
          type,
          prompt: data.get("prompt"),
          options,
          correctAnswer,
          explanation: data.get("explanation"),
          difficulty: data.get("difficulty"),
          position: Number(data.get("position"))
        }
      });
      setEditingQuestion(null);
      await reload();
    }, "Question updated.");
  }

  async function deleteQuestion(question: AdminQuestion) {
    if (!confirm("Delete this question? This cannot be undone and will remove any students' saved answers to it.")) return;
    await withHandling(async () => {
      await api(`/admin/questions/${question.id}`, { method: "DELETE" });
      await reload();
    }, "Question deleted.");
  }

  if (!ready) return null;
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading...</main>;

  if (!course || !courseModule || !task) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Courses", href: "/admin/courses" }, { label: "Not found" }]} />
        <div className="mt-6">
          <EmptyState title="Lesson not found" body="It may have been deleted. Go back to the courseModule." />
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
          { label: courseModule.title, href: `/admin/courses/${course.id}/modules/${courseModule.id}` },
          { label: task.title }
        ]}
      />
      {(error || loadError) && <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error || loadError}</p>}
      {message && <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}

      <Card className="mt-6 p-5">
        {editingBasic ? (
          <form className="grid gap-3" onSubmit={saveTaskBasic}>
            <input className="rounded-md border border-line px-3 py-2" name="title" defaultValue={task.title} required />
            <input className="rounded-md border border-line px-3 py-2" name="slug" defaultValue={task.slug} required />
            <select className="rounded-md border border-line bg-surface px-3 py-2 text-muted" defaultValue={task.type} disabled>
              <option value="VIDEO">Video</option>
              <option value="ARTICLE">Reading Material</option>
              <option value="ASSESSMENT">Assessment</option>
            </select>
            <p className="text-xs text-muted">Type cannot be changed after creation — delete and recreate the lesson for a different type.</p>
            <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="description" defaultValue={task.description} required />
            <div className="grid gap-3 sm:grid-cols-3">
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
              <Button type="button" variant="secondary" onClick={() => setEditingBasic(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{task.type}</Badge>
                <Badge>{task.status}</Badge>
                <Badge>{task.durationMinutes} min</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-bold">{task.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">{task.description}</p>
            </div>
            <Button variant="secondary" onClick={() => setEditingBasic(true)}>Edit Lesson Details</Button>
          </div>
        )}
      </Card>

      {task.type === "ARTICLE" && (
        <Card className="mt-6 p-5">
          <h2 className="text-lg font-semibold">Reading Material</h2>
          <form className="mt-4 grid gap-3" onSubmit={saveArticle}>
            <input className="rounded-md border border-line px-3 py-2" name="coverImageUrl" placeholder="Cover image URL" defaultValue={task.article?.coverImageUrl ?? ""} required />
            <input className="rounded-md border border-line px-3 py-2" name="estimatedReadingMinutes" type="number" placeholder="Estimated reading minutes" defaultValue={task.article?.estimatedReadingMinutes ?? ""} required />
            <RichTextEditor key={task.id} content={articleContent} onChange={(json) => setArticleContent(json as Content)} />
            <Button>Save Reading Material</Button>
          </form>
        </Card>
      )}

      {task.type === "ASSESSMENT" && (
        <>
          <Card className="mt-6 p-5">
            <h2 className="text-lg font-semibold">Assessment Settings</h2>
            <form className="mt-4 grid gap-3" onSubmit={saveAssessmentSettings}>
              <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="instructions" placeholder="Instructions" defaultValue={task.assessment?.instructions ?? ""} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-md border border-line px-3 py-2" name="timerMinutes" type="number" placeholder="Timer minutes" defaultValue={task.assessment?.timerMinutes ?? ""} required />
                <input className="rounded-md border border-line px-3 py-2" name="passingScore" type="number" placeholder="Passing score %" defaultValue={task.assessment?.passingScore ?? ""} required />
              </div>
              <Button>Save Assessment Settings</Button>
            </form>
          </Card>

          {!task.assessment ? (
            <div className="mt-4">
              <EmptyState title="Save assessment settings first" body="Once saved, you can add questions below." />
            </div>
          ) : (
            <>
              <Card className="mt-6 p-5">
                <h2 className="text-lg font-semibold">Add Question</h2>
                <form className="mt-4 grid gap-3" onSubmit={createQuestion}>
                  <select className="rounded-md border border-line px-3 py-2" name="type" required>
                    <option value="MCQ">MCQ</option>
                    <option value="FILL_BLANK">Fill Blank</option>
                  </select>
                  <textarea className="min-h-20 rounded-md border border-line px-3 py-2" name="prompt" placeholder="Question" required />
                  <input className="rounded-md border border-line px-3 py-2" name="options" placeholder="Options comma-separated (MCQ only)" />
                  <input className="rounded-md border border-line px-3 py-2" name="correctAnswer" placeholder="Correct answer" required />
                  <input className="rounded-md border border-line px-3 py-2" name="explanation" placeholder="Explanation" required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="rounded-md border border-line px-3 py-2" name="difficulty" required defaultValue="EASY">
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                    <input className="rounded-md border border-line px-3 py-2" name="position" type="number" placeholder="Position" defaultValue={task.assessment.questions.length} required />
                  </div>
                  <Button>Add Question</Button>
                </form>
              </Card>

              <h2 className="mt-6 text-lg font-semibold">Questions ({task.assessment.questions.length})</h2>
              <div className="mt-3 grid gap-3">
                {task.assessment.questions.length === 0 && <EmptyState title="No questions yet" body="Add the first question above." />}
                {task.assessment.questions.map((question) => (
                  <Card key={question.id} className="p-4">
                    {editingQuestion?.id === question.id ? (
                      <form className="grid gap-2" onSubmit={saveQuestionEdit}>
                        <select className="rounded-md border border-line px-3 py-2" name="type" defaultValue={question.type} required>
                          <option value="MCQ">MCQ</option>
                          <option value="FILL_BLANK">Fill Blank</option>
                        </select>
                        <textarea className="min-h-16 rounded-md border border-line px-3 py-2" name="prompt" defaultValue={question.prompt} required />
                        <input className="rounded-md border border-line px-3 py-2" name="options" defaultValue={question.options.join(", ")} placeholder="Options comma-separated (MCQ only)" />
                        <input className="rounded-md border border-line px-3 py-2" name="correctAnswer" defaultValue={question.correctAnswer} required />
                        <input className="rounded-md border border-line px-3 py-2" name="explanation" defaultValue={question.explanation} required />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select className="rounded-md border border-line px-3 py-2" name="difficulty" defaultValue={question.difficulty} required>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                          <input className="rounded-md border border-line px-3 py-2" name="position" type="number" defaultValue={question.position} required />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Save</Button>
                          <Button type="button" variant="secondary" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge>{question.type}</Badge>
                            <Badge>{question.difficulty}</Badge>
                          </div>
                          <p className="mt-2 font-medium">{question.prompt}</p>
                          {question.options.length > 0 && <p className="mt-1 text-sm text-muted">Options: {question.options.join(", ")}</p>}
                          <p className="mt-1 text-sm text-muted">Correct answer: {question.correctAnswer}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => setEditingQuestion(question)}>Edit</Button>
                          <Button variant="danger" onClick={() => deleteQuestion(question)}>Delete</Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

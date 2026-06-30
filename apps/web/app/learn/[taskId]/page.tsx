"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronLeft, FileText, Menu, PlayCircle, Timer, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type RichNode = { type: string; text?: string; attrs?: { level?: number }; content?: RichNode[] };
type Task = {
  id: string;
  title: string;
  type: "VIDEO" | "ARTICLE" | "ASSESSMENT";
  description: string;
  durationMinutes: number;
  vimeoUrl?: string;
  completed: boolean;
  article?: { coverImageUrl: string; estimatedReadingMinutes: number; content: RichNode };
  assessment?: {
    id: string;
    instructions: string;
    timerMinutes: number;
    passingScore: number;
    questions: Array<{ id: string; type: string; prompt: string; options: string[] }>;
  };
  course: {
    id: string;
    title: string;
    progressPercent: number;
    modules: Array<{ id: string; title: string; tasks: Array<{ id: string; title: string; type: string }> }>;
  };
};

function renderNode(node: RichNode, index = 0): React.ReactNode {
  if (node.type === "text") return node.text;
  const children = node.content?.map((child, childIndex) => renderNode(child, childIndex));
  if (node.type === "heading") return <h2 key={index}>{children}</h2>;
  if (node.type === "paragraph") return <p key={index}>{children}</p>;
  if (node.type === "bulletList") return <ul key={index}>{children}</ul>;
  if (node.type === "listItem") return <li key={index}>{children}</li>;
  return <div key={index}>{children}</div>;
}

export default function LearnPage() {
  const params = useParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [attemptId, setAttemptId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ percentage: number; score: number; total: number; passed: boolean } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    api<Task>(`/tasks/${params.taskId}`).then((data) => {
      setTask(data);
      setSecondsLeft((data.assessment?.timerMinutes ?? 0) * 60);
      setAttemptId("");
      setResult(null);
      setDrawer(false);
    });
  }, [params.taskId]);

  const flatTasks = useMemo(() => task?.course.modules.flatMap((module) => module.tasks) ?? [], [task]);

  const submit = useCallback(async () => {
    if (!task?.assessment || !attemptId) return;
    const response = await api<{ percentage: number; score: number; total: number; passed: boolean }>(`/assessments/${task.assessment.id}/submit`, {
      method: "POST",
      json: {
        attemptId,
        answers: task.assessment.questions.map((question) => ({ questionId: question.id, response: answers[question.id] ?? "" }))
      }
    });
    setResult(response);
  }, [answers, attemptId, task]);

  useEffect(() => {
    if (!task?.assessment || !attemptId || result || secondsLeft <= 0) return;
    const interval = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(interval);
  }, [attemptId, result, secondsLeft, task?.assessment]);

  useEffect(() => {
    if (task?.assessment && attemptId && secondsLeft === 0 && !result) void submit();
  }, [attemptId, result, secondsLeft, submit, task?.assessment]);

  async function markComplete() {
    if (!task) return;
    await api(`/progress/${task.id}/complete`, { method: "POST" });
    setTask({ ...task, completed: true, course: { ...task.course, progressPercent: Math.min(100, task.course.progressPercent + 10) } });
  }

  async function startAssessment() {
    if (!task?.assessment) return;
    const attempt = await api<{ id: string }>(`/assessments/${task.assessment.id}/start`, { method: "POST" });
    setAttemptId(attempt.id);
  }

  if (!task) return <main className="mx-auto max-w-7xl px-4 py-10 text-muted">Loading learning workspace...</main>;

  const sidebar = (
    <aside className="h-full overflow-y-auto border-r border-line bg-white p-4">
      <Link href={`/courses/${task.course.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
        <ChevronLeft size={16} /> Course
      </Link>
      <h2 className="mt-4 text-lg font-bold">{task.course.title}</h2>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-sm"><span>Course Progress</span><span>{task.course.progressPercent}%</span></div>
        <ProgressBar value={task.course.progressPercent} />
      </div>
      <div className="mt-6 grid gap-5">
        {task.course.modules.map((module) => (
          <div key={module.id}>
            <h3 className="text-sm font-semibold text-ink">{module.title}</h3>
            <div className="mt-2 grid gap-1">
              {module.tasks.map((item) => {
                const active = item.id === task.id;
                return (
                  <Link
                    key={item.id}
                    href={`/learn/${item.id}`}
                    className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface", active && "bg-blue-50 text-primary")}
                  >
                    {active ? <PlayCircle size={15} /> : <FileText size={15} />}
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );

  const nextTask = flatTasks[flatTasks.findIndex((item) => item.id === task.id) + 1];

  return (
    <main className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[320px_1fr]">
      <div className="hidden lg:block">{sidebar}</div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-sm bg-white">
            <button className="absolute right-3 top-3 rounded-md p-2 hover:bg-surface" onClick={() => setDrawer(false)}><X size={18} /></button>
            {sidebar}
          </div>
        </div>
      )}
      <section className="min-w-0 bg-surface">
        <div className="border-b border-line bg-white px-4 py-4 sm:px-6">
          <button className="mb-4 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold lg:hidden" onClick={() => setDrawer(true)}>
            <Menu size={16} /> Modules
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{task.type}</p>
              <h1 className="mt-1 text-2xl font-bold">{task.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{task.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              {task.completed && <CheckCircle2 className="text-success" size={18} />}
              {task.durationMinutes} min
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {task.type === "VIDEO" && (
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe className="h-full w-full" src={task.vimeoUrl} allow="autoplay; fullscreen; picture-in-picture" title={task.title} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <p className="text-sm text-muted">Watch the lesson, then mark it complete.</p>
                <Button onClick={markComplete} disabled={task.completed}>{task.completed ? "Completed" : "Mark Complete"}</Button>
              </div>
            </Card>
          )}

          {task.type === "ARTICLE" && task.article && (
            <Card className="overflow-hidden">
              <Image className="h-64 w-full object-cover" src={task.article.coverImageUrl} alt="" width={1100} height={420} />
              <article className="prose-aeropath mx-auto max-w-3xl p-6 sm:p-10">
                <p className="text-sm font-semibold text-primary">{task.article.estimatedReadingMinutes} min read</p>
                {task.article.content.content?.map((node, index) => renderNode(node, index))}
                <Button className="mt-6" onClick={markComplete} disabled={task.completed}>{task.completed ? "Completed" : "Mark Complete"}</Button>
              </article>
            </Card>
          )}

          {task.type === "ASSESSMENT" && task.assessment && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                <div>
                  <h2 className="text-xl font-semibold">Assessment</h2>
                  <p className="mt-2 text-sm text-muted">{task.assessment.instructions}</p>
                </div>
                <div className="rounded-md bg-surface px-3 py-2 text-sm font-semibold"><Timer size={15} className="mr-1 inline" />{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</div>
              </div>
              {!attemptId ? (
                <Button className="mt-5" onClick={startAssessment}>Start Assessment</Button>
              ) : (
                <div className="mt-5 grid gap-5">
                  {task.assessment.questions.map((question, index) => (
                    <div key={question.id} className="rounded-lg border border-line p-4">
                      <p className="font-semibold">{index + 1}. {question.prompt}</p>
                      {question.options.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {question.options.map((option) => (
                            <label key={option} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
                              <input type="radio" name={question.id} value={option} onChange={() => setAnswers({ ...answers, [question.id]: option })} />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input className="mt-3 w-full rounded-md border border-line px-3 py-2" onChange={(event) => setAnswers({ ...answers, [question.id]: event.target.value })} />
                      )}
                    </div>
                  ))}
                  {result ? (
                    <div className="rounded-md bg-blue-50 p-4 text-sm">
                      <strong>Final Score:</strong> {result.score}/{result.total} · {result.percentage}% · {result.passed ? "Passed" : "Review and retry"}
                    </div>
                  ) : (
                    <Button onClick={submit}>Submit</Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {nextTask && (
            <div className="mt-6 flex justify-end">
              <Link className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-surface" href={`/learn/${nextTask.id}`}>
                Next: {nextTask.title}
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

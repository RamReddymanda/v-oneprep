import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PublishStatus, TaskType } from "@prisma/client";
import { scoreAnswers } from "../utils/scoring";
import { PrismaService } from "./prisma.service";

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async unlockedCourseIds(userId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: { plan: { include: { courses: true } } }
    });
    return new Set(purchases.flatMap((purchase) => purchase.plan.courses.map((course) => course.id)));
  }

  async courseProgress(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { include: { tasks: true } } }
    });
    if (!course) return 0;
    const taskIds = course.modules.flatMap((module) => module.tasks.map((task) => task.id));
    if (taskIds.length === 0) return 0;
    const completed = await this.prisma.progress.count({ where: { userId, taskId: { in: taskIds } } });
    return Math.round((completed / taskIds.length) * 100);
  }

  async listCourses(userId?: string) {
    const unlocked = userId ? await this.unlockedCourseIds(userId) : new Set<string>();
    const courses = await this.prisma.course.findMany({
      where: { status: PublishStatus.PUBLISHED },
      include: { modules: { include: { tasks: true } } },
      orderBy: { createdAt: "asc" }
    });
    return Promise.all(
      courses.map(async (course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        bannerUrl: course.bannerUrl,
        estimatedDurationMinutes: course.estimatedDurationMinutes,
        moduleCount: course.modules.length,
        progressPercent: userId ? await this.courseProgress(userId, course.id) : 0,
        isUnlocked: unlocked.has(course.id)
      }))
    );
  }

  async dashboard(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const courses = await this.listCourses(userId);
    const purchasedCourses = courses.filter((course) => course.isUnlocked);
    const completedLessons = await this.prisma.progress.count({ where: { userId } });
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      include: { assessment: { include: { task: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5
    });
    const averageScore =
      attempts.length === 0
        ? 0
        : Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length);
    const currentProgress =
      purchasedCourses.length === 0
        ? 0
        : Math.round(purchasedCourses.reduce((total, course) => total + course.progressPercent, 0) / purchasedCourses.length);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt.toISOString(),
        active: user.active
      },
      purchasedCourses,
      stats: {
        coursesPurchased: purchasedCourses.length,
        completedLessons,
        averageScore,
        currentProgress
      },
      recentAssessments: attempts.map((attempt) => ({
        id: attempt.id,
        title: attempt.assessment.task.title,
        score: attempt.score,
        percentage: attempt.percentage,
        submittedAt: attempt.submittedAt?.toISOString() ?? ""
      }))
    };
  }

  async course(userId: string, courseId: string) {
    const unlocked = await this.unlockedCourseIds(userId);
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { tasks: { include: { progress: { where: { userId } } }, orderBy: { position: "asc" } } },
          orderBy: { position: "asc" }
        }
      }
    });
    if (!course || course.status !== PublishStatus.PUBLISHED) throw new NotFoundException("Course not found");
    if (!unlocked.has(course.id)) throw new ForbiddenException("Course is locked");
    return {
      ...course,
      progressPercent: await this.courseProgress(userId, course.id),
      modules: course.modules.map((module) => ({
        ...module,
        tasks: module.tasks.map((task) => ({ ...task, completed: task.progress.length > 0, locked: false }))
      }))
    };
  }

  async task(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        article: true,
        assessment: { include: { questions: { orderBy: { position: "asc" } } } },
        module: { include: { course: { include: { modules: { include: { tasks: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } } } },
        progress: { where: { userId } }
      }
    });
    if (!task || task.status !== PublishStatus.PUBLISHED) throw new NotFoundException("Task not found");
    const unlocked = await this.unlockedCourseIds(userId);
    if (!unlocked.has(task.module.courseId)) throw new ForbiddenException("Task is locked");
    return {
      ...task,
      completed: task.progress.length > 0,
      course: {
        ...task.module.course,
        progressPercent: await this.courseProgress(userId, task.module.courseId),
        modules: task.module.course.modules
      },
      assessment:
        task.assessment && task.type === TaskType.ASSESSMENT
          ? {
              ...task.assessment,
              questions: task.assessment.questions.map((question) => ({
                id: question.id,
                type: question.type,
                prompt: question.prompt,
                options: question.options,
                difficulty: question.difficulty,
                position: question.position
              }))
            }
          : task.assessment
    };
  }

  async complete(userId: string, taskId: string) {
    await this.task(userId, taskId);
    return this.prisma.progress.upsert({
      where: { userId_taskId: { userId, taskId } },
      update: { completedAt: new Date() },
      create: { userId, taskId }
    });
  }

  async startAssessment(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { task: true, questions: true }
    });
    if (!assessment) throw new NotFoundException("Assessment not found");
    await this.task(userId, assessment.taskId);
    return this.prisma.assessmentAttempt.create({
      data: {
        userId,
        assessmentId,
        total: assessment.questions.length
      }
    });
  }

  async submitAssessment(userId: string, assessmentId: string, attemptId: string, answers: Array<{ questionId: string; response: string }>) {
    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id: assessmentId },
      include: { task: true, questions: { orderBy: { position: "asc" } } }
    });
    const attempt = await this.prisma.assessmentAttempt.findFirstOrThrow({
      where: { id: attemptId, userId, assessmentId }
    });
    if (attempt.submittedAt) return attempt;

    const scored = scoreAnswers(assessment.questions, answers);
    await this.prisma.answer.createMany({
      data: scored.results.map((result) => ({
        attemptId,
        questionId: result.questionId,
        response: result.response,
        correct: result.correct
      }))
    });
    const updated = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score: scored.score,
        total: scored.total,
        percentage: scored.percentage
      }
    });
    await this.complete(userId, assessment.taskId);
    return {
      attemptId,
      score: scored.score,
      total: scored.total,
      percentage: scored.percentage,
      passed: scored.percentage >= assessment.passingScore,
      answers: scored.results.map((result) => ({
        questionId: result.questionId,
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation
      })),
      submittedAt: updated.submittedAt
    };
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { PublishStatus, Role } from "@prisma/client";
import { Roles } from "../auth-context";
import { ArticleDto, AssessmentDto, CourseDto, ModuleDto, PlanDto, QuestionDto, TaskDto } from "../dto";
import { PrismaService } from "../services/prisma.service";

@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("metrics")
  async metrics() {
    const [totalUsers, totalStudents, totalCourses, assessmentsTaken, payments, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.course.count(),
      this.prisma.assessmentAttempt.count({ where: { submittedAt: { not: null } } }),
      this.prisma.payment.findMany({ where: { status: "MOCK_SUCCESS" } }),
      this.prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
    ]);
    return {
      totalUsers,
      totalStudents,
      totalCourses,
      revenue: payments.reduce((total, payment) => total + payment.amountInr, 0),
      assessmentsTaken,
      recentActivity: recentUsers.map((user) => ({
        id: user.id,
        label: `${user.firstName} ${user.lastName} joined`,
        createdAt: user.createdAt
      }))
    };
  }

  @Get("courses")
  courses() {
    return this.prisma.course.findMany({
      include: {
        modules: {
          include: {
            tasks: {
              include: {
                article: true,
                assessment: { include: { questions: { orderBy: { position: "asc" } } } }
              },
              orderBy: { position: "asc" }
            }
          },
          orderBy: { position: "asc" }
        },
        plans: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("courses")
  createCourse(@Body() dto: CourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  @Patch("courses/:id")
  updateCourse(@Param("id") id: string, @Body() dto: Partial<CourseDto>) {
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  @Delete("courses/:id")
  deleteCourse(@Param("id") id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  @Post("courses/:id/publish")
  publishCourse(@Param("id") id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: PublishStatus.PUBLISHED } });
  }

  @Post("courses/:id/unpublish")
  unpublishCourse(@Param("id") id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: PublishStatus.DRAFT } });
  }

  @Post("modules")
  createModule(@Body() dto: ModuleDto) {
    return this.prisma.module.create({ data: dto });
  }

  @Patch("modules/:id")
  updateModule(@Param("id") id: string, @Body() dto: Partial<ModuleDto>) {
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  @Delete("modules/:id")
  deleteModule(@Param("id") id: string) {
    return this.prisma.module.delete({ where: { id } });
  }

  @Post("tasks")
  createTask(@Body() dto: TaskDto) {
    return this.prisma.task.create({ data: dto });
  }

  @Patch("tasks/:id")
  updateTask(@Param("id") id: string, @Body() dto: Partial<TaskDto>) {
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  @Delete("tasks/:id")
  deleteTask(@Param("id") id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  @Get("plans")
  plans() {
    return this.prisma.plan.findMany({ include: { courses: true }, orderBy: { createdAt: "desc" } });
  }

  @Post("plans")
  createPlan(@Body() dto: PlanDto) {
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        priceInr: dto.priceInr,
        features: dto.features,
        status: dto.status,
        courses: { connect: dto.courseIds.map((id) => ({ id })) }
      }
    });
  }

  @Patch("plans/:id")
  updatePlan(@Param("id") id: string, @Body() dto: Partial<PlanDto>) {
    return this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name,
        priceInr: dto.priceInr,
        features: dto.features,
        status: dto.status,
        courses: dto.courseIds ? { set: dto.courseIds.map((courseId) => ({ id: courseId })) } : undefined
      }
    });
  }

  @Delete("plans/:id")
  deletePlan(@Param("id") id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  @Post("questions")
  createQuestion(@Body() dto: QuestionDto) {
    return this.prisma.question.create({ data: dto });
  }

  @Post("articles")
  createArticle(@Body() dto: ArticleDto) {
    return this.prisma.article.upsert({
      where: { taskId: dto.taskId },
      update: {
        coverImageUrl: dto.coverImageUrl,
        estimatedReadingMinutes: dto.estimatedReadingMinutes,
        content: dto.content as object
      },
      create: {
        taskId: dto.taskId,
        coverImageUrl: dto.coverImageUrl,
        estimatedReadingMinutes: dto.estimatedReadingMinutes,
        content: dto.content as object
      }
    });
  }

  @Post("assessments")
  createAssessment(@Body() dto: AssessmentDto) {
    return this.prisma.assessment.upsert({
      where: { taskId: dto.taskId },
      update: {
        instructions: dto.instructions,
        timerMinutes: dto.timerMinutes,
        passingScore: dto.passingScore
      },
      create: dto
    });
  }

  @Get("users")
  users() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        purchases: { include: { plan: true } },
        progress: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Patch("users/:id/active")
  setActive(@Param("id") id: string, @Body() dto: { active: boolean }) {
    return this.prisma.user.update({ where: { id }, data: { active: dto.active } });
  }
}

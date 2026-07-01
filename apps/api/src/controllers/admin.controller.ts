import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { DiscountType, PaymentStatus, Prisma, PublishStatus, Role } from "@prisma/client";
import { Roles } from "../auth-context";
import { ArticleDto, AssessmentDto, CourseDto, ModuleDto, PlanDto, QuestionDto, TaskDto } from "../dto";
import { PrismaService } from "../services/prisma.service";
import { UploadsService } from "../services/uploads.service";
import { withFinalPrice } from "../utils/pricing";
import { imageUploadOptions } from "../utils/upload-config";

function assertValidDiscount(priceInr: number, discountType: DiscountType, discountValue: number) {
  if (discountType === DiscountType.PERCENTAGE && (discountValue < 0 || discountValue > 100)) {
    throw new BadRequestException("Percentage discount must be between 0 and 100");
  }
  if (discountType === DiscountType.FIXED && discountValue > priceInr) {
    throw new BadRequestException("Fixed discount cannot exceed the plan price");
  }
}

@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService
  ) {}

  @Get("metrics")
  async metrics() {
    const [totalUsers, totalStudents, totalCourses, assessmentsTaken, payments, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.course.count(),
      this.prisma.assessmentAttempt.count({ where: { submittedAt: { not: null } } }),
      this.prisma.payment.findMany({ where: { status: PaymentStatus.APPROVED } }),
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
  async createCourse(@Body() dto: CourseDto) {
    try {
      return await this.prisma.course.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Slug already exists");
      }
      throw error;
    }
  }

  @Patch("courses/:id")
  async updateCourse(@Param("id") id: string, @Body() dto: Partial<CourseDto>) {
    try {
      return await this.prisma.course.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Slug already exists");
      }
      throw error;
    }
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
  async createTask(@Body() dto: TaskDto) {
    try {
      return await this.prisma.task.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Slug already exists");
      }
      throw error;
    }
  }

  @Patch("tasks/:id")
  async updateTask(@Param("id") id: string, @Body() dto: Partial<TaskDto>) {
    try {
      return await this.prisma.task.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Slug already exists");
      }
      throw error;
    }
  }

  @Delete("tasks/:id")
  deleteTask(@Param("id") id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  @Get("plans")
  async plans() {
    const plans = await this.prisma.plan.findMany({ include: { courses: true }, orderBy: { createdAt: "desc" } });
    return plans.map(withFinalPrice);
  }

  @Post("plans")
  async createPlan(@Body() dto: PlanDto) {
    assertValidDiscount(dto.priceInr, dto.discountType, dto.discountValue);
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        priceInr: dto.priceInr,
        features: dto.features,
        status: dto.status,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        courses: { connect: dto.courseIds.map((id) => ({ id })) }
      },
      include: { courses: true }
    });
    return withFinalPrice(plan);
  }

  @Patch("plans/:id")
  async updatePlan(@Param("id") id: string, @Body() dto: Partial<PlanDto>) {
    const current = await this.prisma.plan.findUniqueOrThrow({ where: { id } });
    const priceInr = dto.priceInr ?? current.priceInr;
    const discountType = dto.discountType ?? current.discountType;
    const discountValue = dto.discountValue ?? current.discountValue;
    assertValidDiscount(priceInr, discountType, discountValue);
    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name,
        priceInr: dto.priceInr,
        features: dto.features,
        status: dto.status,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        courses: dto.courseIds ? { set: dto.courseIds.map((courseId) => ({ id: courseId })) } : undefined
      },
      include: { courses: true }
    });
    return withFinalPrice(plan);
  }

  @Delete("plans/:id")
  deletePlan(@Param("id") id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  @Post("questions")
  createQuestion(@Body() dto: QuestionDto) {
    return this.prisma.question.create({ data: dto });
  }

  @Patch("questions/:id")
  updateQuestion(@Param("id") id: string, @Body() dto: Partial<QuestionDto>) {
    return this.prisma.question.update({ where: { id }, data: dto });
  }

  @Delete("questions/:id")
  deleteQuestion(@Param("id") id: string) {
    return this.prisma.question.delete({ where: { id } });
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
    return this.prisma.user.update({
      where: { id },
      data: { active: dto.active },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true, createdAt: true }
    });
  }

  @Get("payments")
  payments(@Query("status") status?: PaymentStatus) {
    return this.prisma.payment.findMany({
      where: { status: status ?? PaymentStatus.PENDING_REVIEW },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        plan: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  @Post("payments/:id/approve")
  async approvePayment(@Param("id") id: string) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.APPROVED, reviewedAt: new Date() }
      });
      await tx.purchase.upsert({
        where: { userId_planId: { userId: payment.userId, planId: payment.planId } },
        update: {},
        create: { userId: payment.userId, planId: payment.planId }
      });
      return updated;
    });
  }

  @Post("payments/:id/reject")
  rejectPayment(@Param("id") id: string, @Body() dto: { reviewNote?: string }) {
    return this.prisma.payment.update({
      where: { id },
      data: { status: PaymentStatus.REJECTED, reviewedAt: new Date(), reviewNote: dto.reviewNote }
    });
  }

  @Get("settings")
  async settings() {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: "singleton" } });
    return settings ?? { id: "singleton", qrCodeUrl: null };
  }

  @Post("settings/qr-code")
  @UseInterceptors(FileInterceptor("file", imageUploadOptions()))
  async uploadQrCode(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException("No file uploaded");
    const origin = `${req.protocol}://${req.get("host")}`;
    const qrCodeUrl = await this.uploads.storeFile(file, origin);
    await this.prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: { qrCodeUrl },
      create: { id: "singleton", qrCodeUrl }
    });
    return { qrCodeUrl };
  }
}

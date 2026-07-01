import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus, PublishStatus } from "@prisma/client";
import { computeFinalPriceInr } from "../utils/pricing";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkoutInfo(planId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, status: PublishStatus.PUBLISHED },
      include: { courses: true }
    });
    if (!plan) throw new NotFoundException("Plan not found");
    const settings = await this.prisma.appSettings.findUnique({ where: { id: "singleton" } });
    const finalPriceInr = computeFinalPriceInr(plan.priceInr, plan.discountType, plan.discountValue);
    return {
      plan: { ...plan, finalPriceInr },
      qrCodeUrl: settings?.qrCodeUrl ?? null
    };
  }

  async submit(userId: string, planId: string, screenshotUrl: string, referenceNote?: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id: planId, status: PublishStatus.PUBLISHED } });
    if (!plan) throw new NotFoundException("Plan not found");

    const existing = await this.prisma.payment.findFirst({
      where: { userId, planId, status: PaymentStatus.PENDING_REVIEW }
    });
    if (existing) throw new ConflictException("A payment for this plan is already pending review");

    const amountInr = computeFinalPriceInr(plan.priceInr, plan.discountType, plan.discountValue);
    return this.prisma.payment.create({
      data: {
        userId,
        planId,
        amountInr,
        status: PaymentStatus.PENDING_REVIEW,
        screenshotUrl,
        referenceNote
      }
    });
  }

  me(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    });
  }

  purchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: { plan: { include: { courses: true } } },
      orderBy: { createdAt: "desc" }
    });
  }
}

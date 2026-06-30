import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus, PublishStatus } from "@prisma/client";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, planId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, status: PublishStatus.PUBLISHED },
      include: { courses: true }
    });
    if (!plan) throw new NotFoundException("Plan not found");
    return {
      checkoutId: `mock_rzp_${Date.now()}`,
      provider: "MOCK_RAZORPAY",
      plan: {
        id: plan.id,
        name: plan.name,
        priceInr: plan.priceInr,
        courseIds: plan.courses.map((course) => course.id)
      },
      userId
    };
  }

  async success(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { id: planId } });
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        planId,
        amountInr: plan.priceInr,
        status: PaymentStatus.MOCK_SUCCESS,
        providerRef: `mock_success_${Date.now()}`
      }
    });
    const purchase = await this.prisma.purchase.upsert({
      where: { userId_planId: { userId, planId } },
      update: {},
      create: { userId, planId }
    });
    return { payment, purchase };
  }

  purchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId },
      include: { plan: { include: { courses: true } } },
      orderBy: { createdAt: "desc" }
    });
  }
}

import { Controller, Get } from "@nestjs/common";
import { PublishStatus } from "@prisma/client";
import { Public } from "../auth-context";
import { PrismaService } from "../services/prisma.service";

@Controller("plans")
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  findAll() {
    return this.prisma.plan.findMany({
      where: { status: PublishStatus.PUBLISHED },
      include: { courses: true },
      orderBy: { priceInr: "asc" }
    });
  }
}

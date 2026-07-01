import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../auth-context";
import { SubmitPaymentDto } from "../dto";
import { PaymentsService } from "../services/payments.service";

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("payments/checkout/:planId")
  checkoutInfo(@Param("planId") planId: string) {
    return this.payments.checkoutInfo(planId);
  }

  @Post("payments/submit")
  submit(@CurrentUser() user: RequestUser, @Body() dto: SubmitPaymentDto) {
    return this.payments.submit(user.id, dto.planId, dto.screenshotUrl, dto.referenceNote);
  }

  @Get("payments/me")
  me(@CurrentUser() user: RequestUser) {
    return this.payments.me(user.id);
  }

  @Get("purchases/me")
  purchases(@CurrentUser() user: RequestUser) {
    return this.payments.purchases(user.id);
  }
}

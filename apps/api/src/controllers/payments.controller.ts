import { Body, Controller, Get, Post } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../auth-context";
import { CheckoutDto } from "../dto";
import { PaymentsService } from "../services/payments.service";

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("payments/mock-checkout")
  checkout(@CurrentUser() user: RequestUser, @Body() dto: CheckoutDto) {
    return this.payments.checkout(user.id, dto.planId);
  }

  @Post("payments/mock-success")
  success(@CurrentUser() user: RequestUser, @Body() dto: CheckoutDto) {
    return this.payments.success(user.id, dto.planId);
  }

  @Get("purchases/me")
  purchases(@CurrentUser() user: RequestUser) {
    return this.payments.purchases(user.id);
  }
}

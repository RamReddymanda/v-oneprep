import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AdminController } from "./controllers/admin.controller";
import { AuthController } from "./controllers/auth.controller";
import { LearningController } from "./controllers/learning.controller";
import { PaymentsController } from "./controllers/payments.controller";
import { PlansController } from "./controllers/plans.controller";
import { UploadsController } from "./controllers/uploads.controller";
import { RolesGuard } from "./guards/roles.guard";
import { AuthService } from "./services/auth.service";
import { LearningService } from "./services/learning.service";
import { PaymentsService } from "./services/payments.service";
import { PrismaService } from "./services/prisma.service";
import { UploadsService } from "./services/uploads.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    AuthController,
    PlansController,
    PaymentsController,
    LearningController,
    AdminController,
    UploadsController
  ],
  providers: [
    PrismaService,
    AuthService,
    PaymentsService,
    LearningService,
    UploadsService,
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule {}

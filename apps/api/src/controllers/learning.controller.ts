import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CurrentUser, Public, RequestUser } from "../auth-context";
import { SubmitAssessmentDto } from "../dto";
import { LearningService } from "../services/learning.service";

@Controller()
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get("dashboard")
  dashboard(@CurrentUser() user: RequestUser) {
    return this.learning.dashboard(user.id);
  }

  @Get("profile")
  profile(@CurrentUser() user: RequestUser) {
    return this.learning.dashboard(user.id);
  }

  @Public()
  @Get("courses")
  courses() {
    return this.learning.listCourses();
  }

  @Get("courses/:courseId")
  course(@CurrentUser() user: RequestUser, @Param("courseId") courseId: string) {
    return this.learning.course(user.id, courseId);
  }

  @Get("tasks/:taskId")
  task(@CurrentUser() user: RequestUser, @Param("taskId") taskId: string) {
    return this.learning.task(user.id, taskId);
  }

  @Post("progress/:taskId/complete")
  complete(@CurrentUser() user: RequestUser, @Param("taskId") taskId: string) {
    return this.learning.complete(user.id, taskId);
  }

  @Post("assessments/:assessmentId/start")
  start(@CurrentUser() user: RequestUser, @Param("assessmentId") assessmentId: string) {
    return this.learning.startAssessment(user.id, assessmentId);
  }

  @Post("assessments/:assessmentId/submit")
  submit(@CurrentUser() user: RequestUser, @Param("assessmentId") assessmentId: string, @Body() dto: SubmitAssessmentDto) {
    return this.learning.submitAssessment(user.id, assessmentId, dto.attemptId, dto.answers);
  }
}

import { Allow, IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { PublishStatus, QuestionType, TaskType } from "@prisma/client";

export class SignupDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class CheckoutDto {
  @IsString()
  planId!: string;
}

export class SubmitAssessmentDto {
  @IsString()
  attemptId!: string;

  @IsArray()
  answers!: Array<{ questionId: string; response: string }>;
}

export class CourseDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsString()
  bannerUrl!: string;

  @IsInt()
  @Min(1)
  estimatedDurationMinutes!: number;

  @IsEnum(PublishStatus)
  status!: PublishStatus;
}

export class ModuleDto {
  @IsString()
  courseId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  position!: number;
}

export class TaskDto {
  @IsString()
  moduleId!: string;

  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsEnum(TaskType)
  type!: TaskType;

  @IsString()
  description!: string;

  @IsInt()
  position!: number;

  @IsInt()
  durationMinutes!: number;

  @IsEnum(PublishStatus)
  status!: PublishStatus;

  @IsOptional()
  @IsString()
  vimeoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class PlanDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  priceInr!: number;

  @IsArray()
  features!: string[];

  @IsArray()
  courseIds!: string[];

  @IsEnum(PublishStatus)
  status!: PublishStatus;
}

export class QuestionDto {
  @IsString()
  assessmentId!: string;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  prompt!: string;

  @IsArray()
  options!: string[];

  @IsString()
  correctAnswer!: string;

  @IsString()
  explanation!: string;

  @IsString()
  difficulty!: string;

  @IsInt()
  position!: number;
}

export class ArticleDto {
  @IsString()
  taskId!: string;

  @IsString()
  coverImageUrl!: string;

  @IsInt()
  @Min(1)
  estimatedReadingMinutes!: number;

  @Allow()
  content!: unknown;
}

export class AssessmentDto {
  @IsString()
  taskId!: string;

  @IsString()
  instructions!: string;

  @IsInt()
  @Min(1)
  timerMinutes!: number;

  @IsInt()
  @Min(1)
  passingScore!: number;
}

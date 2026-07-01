export enum Role {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN"
}

export enum TaskType {
  VIDEO = "VIDEO",
  ARTICLE = "ARTICLE",
  ASSESSMENT = "ASSESSMENT"
}

export enum PublishStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

export enum PaymentStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum DiscountType {
  NONE = "NONE",
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED"
}

export enum QuestionDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD"
}

export enum QuestionType {
  MCQ = "MCQ",
  FILL_BLANK = "FILL_BLANK"
}

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  joinedAt: string;
  active: boolean;
};

export type PlanSummary = {
  id: string;
  name: string;
  priceInr: number;
  finalPriceInr: number;
  discountType: DiscountType;
  discountValue: number;
  features: string[];
  status: PublishStatus;
  courseIds: string[];
};

export type CourseSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  estimatedDurationMinutes: number;
  moduleCount: number;
  progressPercent: number;
  isUnlocked: boolean;
};

export type DashboardSummary = {
  user: ApiUser;
  purchasedCourses: CourseSummary[];
  stats: {
    coursesPurchased: number;
    completedLessons: number;
    averageScore: number;
    currentProgress: number;
  };
  recentAssessments: Array<{
    id: string;
    title: string;
    score: number;
    percentage: number;
    submittedAt: string;
  }>;
};

export type AssessmentSubmissionResult = {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: string;
    explanation: string;
  }>;
};

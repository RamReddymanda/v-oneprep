export type AdminQuestion = {
  id: string;
  assessmentId: string;
  type: "MCQ" | "FILL_BLANK";
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  position: number;
};

export type AdminArticle = {
  id: string;
  taskId: string;
  coverImageUrl: string;
  estimatedReadingMinutes: number;
  content: unknown;
};

export type AdminAssessment = {
  id: string;
  taskId: string;
  instructions: string;
  timerMinutes: number;
  passingScore: number;
  questions: AdminQuestion[];
};

export type AdminTask = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: "VIDEO" | "ARTICLE" | "ASSESSMENT";
  description: string;
  position: number;
  durationMinutes: number;
  status: "DRAFT" | "PUBLISHED";
  vimeoUrl?: string | null;
  thumbnailUrl?: string | null;
  article?: AdminArticle | null;
  assessment?: AdminAssessment | null;
};

export type AdminModule = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  position: number;
  tasks: AdminTask[];
};

export type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  estimatedDurationMinutes: number;
  status: "DRAFT" | "PUBLISHED";
  modules: AdminModule[];
};

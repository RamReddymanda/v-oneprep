import { PrismaClient, PublishStatus, QuestionDifficulty, QuestionType, Role, TaskType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [adminPassword, studentPassword] = await Promise.all([
    hash("Admin@12345", 12),
    hash("Student@12345", 12)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aeropath.local" },
    update: {},
    create: {
      firstName: "AeroPath",
      lastName: "Admin",
      email: "admin@aeropath.local",
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student@aeropath.local" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "Student",
      email: "student@aeropath.local",
      passwordHash: studentPassword,
      role: Role.STUDENT
    }
  });

  const course = await prisma.course.upsert({
    where: { slug: "dgca-ground-school-foundation" },
    update: { status: PublishStatus.PUBLISHED },
    create: {
      title: "DGCA Ground School Foundation",
      slug: "dgca-ground-school-foundation",
      description:
        "A focused foundation course for Indian CPL aspirants covering Air Regulations, Meteorology, and Navigation basics.",
      bannerUrl:
        "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1600&q=80",
      estimatedDurationMinutes: 120,
      status: PublishStatus.PUBLISHED
    }
  });

  const plan = await prisma.plan.upsert({
    where: { id: "dgca-foundation-plan" },
    update: {
      status: PublishStatus.PUBLISHED,
      courses: { set: [{ id: course.id }] }
    },
    create: {
      id: "dgca-foundation-plan",
      name: "DGCA Foundation",
      priceInr: 4999,
      features: ["Videos", "Notes", "Assessments", "Progress tracking"],
      status: PublishStatus.PUBLISHED,
      courses: { connect: { id: course.id } }
    }
  });

  await prisma.purchase.upsert({
    where: { userId_planId: { userId: student.id, planId: plan.id } },
    update: {},
    create: { userId: student.id, planId: plan.id }
  });

  const airRegulations = await prisma.module.upsert({
    where: { id: "module-air-regulations" },
    update: {},
    create: {
      id: "module-air-regulations",
      courseId: course.id,
      title: "Air Regulations",
      description: "Rules, licensing, flight discipline, and DGCA fundamentals.",
      position: 1
    }
  });

  const meteorology = await prisma.module.upsert({
    where: { id: "module-meteorology" },
    update: {},
    create: {
      id: "module-meteorology",
      courseId: course.id,
      title: "Meteorology",
      description: "Weather systems, clouds, pressure, and flight planning impact.",
      position: 2
    }
  });

  const videoTask = await prisma.task.upsert({
    where: { slug: "air-regulations-overview-video" },
    update: {},
    create: {
      moduleId: airRegulations.id,
      title: "Air Regulations Overview",
      slug: "air-regulations-overview-video",
      type: TaskType.VIDEO,
      description: "A short orientation to the DGCA Air Regulations paper.",
      position: 1,
      durationMinutes: 3,
      status: PublishStatus.PUBLISHED,
      vimeoUrl: "https://player.vimeo.com/video/76979871",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1474302770737-173ee21bab63?auto=format&fit=crop&w=1000&q=80"
    }
  });

  const articleTask = await prisma.task.upsert({
    where: { slug: "rules-of-the-air-reading" },
    update: {},
    create: {
      moduleId: airRegulations.id,
      title: "Rules of the Air",
      slug: "rules-of-the-air-reading",
      type: TaskType.ARTICLE,
      description: "Professional reading material for right-of-way, VFR basics, and compliance mindset.",
      position: 2,
      durationMinutes: 12,
      status: PublishStatus.PUBLISHED
    }
  });

  await prisma.article.upsert({
    where: { taskId: articleTask.id },
    update: {},
    create: {
      taskId: articleTask.id,
      coverImageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
      estimatedReadingMinutes: 12,
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Why Air Regulations Matter" }] },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text:
                  "Air Regulations are not just exam facts. They create the operating discipline that keeps every flight predictable, legal, and safe."
              }
            ]
          },
          {
            type: "bulletList",
            content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Know right-of-way priorities before entering traffic patterns." }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Read NOTAMs and aerodrome procedures before each flight." }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Treat compliance as cockpit behavior, not just paperwork." }] }] }
            ]
          }
        ]
      }
    }
  });

  const assessmentTask = await prisma.task.upsert({
    where: { slug: "air-regulations-check" },
    update: {},
    create: {
      moduleId: airRegulations.id,
      title: "Air Regulations Check",
      slug: "air-regulations-check",
      type: TaskType.ASSESSMENT,
      description: "A quick MCQ and fill-blank assessment.",
      position: 3,
      durationMinutes: 15,
      status: PublishStatus.PUBLISHED
    }
  });

  const assessment = await prisma.assessment.upsert({
    where: { taskId: assessmentTask.id },
    update: {},
    create: {
      taskId: assessmentTask.id,
      instructions: "Answer all questions. The timer auto-submits after 15 minutes.",
      timerMinutes: 15,
      passingScore: 70
    }
  });

  await prisma.question.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.question.createMany({
    data: [
      {
        assessmentId: assessment.id,
        type: QuestionType.MCQ,
        prompt: "Which authority regulates civil aviation licensing in India?",
        options: ["DGCA", "FAA", "EASA", "ICAO"],
        correctAnswer: "DGCA",
        explanation: "The Directorate General of Civil Aviation regulates civil aviation in India.",
        difficulty: QuestionDifficulty.EASY,
        position: 1
      },
      {
        assessmentId: assessment.id,
        type: QuestionType.FILL_BLANK,
        prompt: "VFR stands for ____ Flight Rules.",
        options: [],
        correctAnswer: "Visual",
        explanation: "VFR means Visual Flight Rules.",
        difficulty: QuestionDifficulty.EASY,
        position: 2
      }
    ]
  });

  await prisma.task.upsert({
    where: { slug: "meteorology-demo-video" },
    update: {},
    create: {
      moduleId: meteorology.id,
      title: "Meteorology Essentials",
      slug: "meteorology-demo-video",
      type: TaskType.VIDEO,
      description: "A compact introduction to weather decisions for pilots.",
      position: 1,
      durationMinutes: 4,
      status: PublishStatus.PUBLISHED,
      vimeoUrl: "https://player.vimeo.com/video/148751763",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1000&q=80"
    }
  });

  console.log(`Seeded AeroPath MVP: admin=${admin.email}, student=${student.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

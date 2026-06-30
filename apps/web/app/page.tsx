import { CheckCircle2, ClipboardCheck, LineChart, MapPinned, PlayCircle } from "lucide-react";
import Image from "next/image";
import { Badge, Card, LinkButton } from "@/components/ui";

const features = [
  { title: "Structured Learning", body: "DGCA-ready modules with videos, articles, and assessments.", icon: PlayCircle },
  { title: "Mock Assessments", body: "Timed checks with scores, correct answers, and explanations.", icon: ClipboardCheck },
  { title: "Progress Tracking", body: "Clear course, module, and task completion across your journey.", icon: LineChart },
  { title: "Career Guidance", body: "Aviation-focused learning paths for serious CPL and ATPL aspirants.", icon: MapPinned }
];

const faqs = [
  ["Is this for Indian DGCA preparation?", "Yes. The MVP is structured around DGCA ground-school learning workflows."],
  ["Are payments real?", "No. The MVP uses a mock Razorpay flow that can be replaced with real Razorpay later."],
  ["Are articles downloadable PDFs?", "No. Reading material is stored as rich article content for a better learning experience."]
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <Badge>DGCA Ground School MVP</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-normal text-ink sm:text-5xl lg:text-6xl">
              Become Airline Ready with DGCA Ground School
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              A premium aviation learning platform for Indian CPL and ATPL aspirants, built around focused lessons,
              professional reading, assessments, and measurable progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/signup">Get Started</LinkButton>
              <LinkButton href="/plans" variant="secondary">View Courses</LinkButton>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
            <Image
              className="h-full min-h-[360px] w-full object-cover"
              src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1400&q=80"
              alt="Pilot training cockpit"
              width={900}
              height={620}
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-5">
                <Icon className="text-primary" size={22} />
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {["Learn", "Practice", "Track"].map((step, index) => (
            <div key={step} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">{index + 1}</span>
              <div>
                <h2 className="text-xl font-semibold">{step}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Move through video, article, and assessment tasks with visible completion status.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1fr]">
          <div>
            <Badge>Plans</Badge>
            <h2 className="mt-4 text-3xl font-bold">Start with DGCA Foundation</h2>
            <p className="mt-3 text-muted">Includes videos, notes, assessments, and progress tracking for the demo course.</p>
            <LinkButton href="/plans" className="mt-6">See Pricing</LinkButton>
          </div>
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h3 className="text-xl font-semibold">DGCA Foundation</h3>
                <p className="text-sm text-muted">Full MVP access</p>
              </div>
              <div className="text-2xl font-bold">₹4,999</div>
            </div>
            <ul className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
              {["Videos", "Rich reading material", "Timed assessments", "Progress dashboard"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="text-success" size={16} />{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {["Feels like a serious pilot-prep product.", "The reading interface is much better than PDFs.", "Progress tracking makes demo conversations easy."].map((quote) => (
              <Card key={quote} className="p-5 text-sm leading-6 text-muted">{quote}</Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-6 divide-y divide-line rounded-lg border border-line">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group p-5">
              <summary className="cursor-pointer font-semibold">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 text-center text-sm text-muted">
        About · Contact · Privacy · Terms
      </footer>
    </main>
  );
}

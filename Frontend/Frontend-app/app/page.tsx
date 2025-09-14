import Link from "next/link";
import Navbar from "@/components/header/navbar";

export default function SimulationPage() {
  return (
    <>
      {/* Fixed navbar */}
      <Navbar />

      {/* Full screen (below navbar) */}
      <main className="relative isolate min-h-[100dvh] bg-background text-foreground">
        {/* Soft spotlight background */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[-20vh] mx-auto h-[60vh] w-[90vw] rounded-full
                     bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/.18),transparent_70%)]"
        />
        {/* Content */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-4 pb-10 md:grid-cols-2 md:pt-0">
          {/* Left: Dashboard */}
          <ChoiceCard
            title="Dashboard"
            description="Get an at-a-glance view of operations metrics and project status. Expand with custom widgets."
            href="/dashboard"  // ← navigates to /dashboard
            badge="Recommended"
            emoji="📊"
          />

          {/* Right: Eliza OS */}
          <ChoiceCard
            title="Eliza OS"
            description="Conversational agents and automation platform. Manage workflows, plugins, and policies in one place."
            href="/eliza"
            badge="New"
            emoji="🤖"
          />
        </section>
      </main>
    </>
  );
}

/* ---------------------------------- */
/* Selectable card                    */
/* ---------------------------------- */
type ChoiceProps = {
  title: string;
  description: string;
  href: string;
  badge?: string;
  emoji?: string;
};

function ChoiceCard({ title, description, href, badge, emoji }: ChoiceProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border bg-card/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.45)]
                 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.55)] focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Open ${title}`}
    >
      {/* Subtle glowing background */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-20%] top-[-20%] h-64 w-64 rounded-full
                   bg-[radial-gradient(45%_45%_at_50%_50%,hsl(var(--primary)/.22),transparent_70%)]
                   transition-transform duration-300 group-hover:scale-110"
      />

      {/* Badge */}
      {badge && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          {badge}
        </span>
      )}

      {/* Heading */}
      <div className="relative z-[1]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <span className="text-lg">{emoji ?? "✨"}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        </div>

        {/* Description */}
        <p className="mt-3 max-w-prose text-sm text-muted-foreground md:text-base">
          {description}
        </p>

        {/* Action */}
        <div className="mt-6">
          <span
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold
                       text-primary-foreground shadow-lg shadow-primary/20 transition
                       group-hover:translate-x-0.5 group-hover:brightness-110"
          >
            Enter <span aria-hidden>→</span>
          </span>
        </div>
      </div>

      {/* Bottom gradient accent (optional) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
    </Link>
  );
}



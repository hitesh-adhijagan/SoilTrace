import { ArrowRight, BookOpen, FlaskConical, MapPinned, Radio, ScrollText, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import EvidenceBadge from "@/components/EvidenceBadge";
import SiteShell from "@/components/SiteShell";
import LocationSelector from "@/components/LocationSelector";
import { useLocationStore } from "@/lib/useLocationStore";

const experiences = [
  { title: "Awareness survey", note: "Share a strictly anonymous perspective on soil pollution awareness.", href: "/survey", icon: Radio, status: "reported" as const, stamp: "FIELD NOTE 01" },
  { title: "Response dashboard", note: "See aggregate patterns only after the privacy threshold is reached.", href: "/dashboard", icon: ScrollText, status: "reported" as const, stamp: "FIELD NOTE 02" },
  { title: "Conceptual experiment", note: "Explore how movement and retention can be represented without measuring soil.", href: "/experiment", icon: FlaskConical, status: "conceptual" as const, stamp: "LAB PLATE 03" },
  { title: "Satellite & Govt map", note: "High-resolution satellite view aligned with ICAR & CPCB regional reference points.", href: "/map", icon: MapPinned, status: "verified" as const, stamp: "ATLAS PLATE 04" },
  { title: "Soil Story & Digital Records", note: "Universal soil matrix journey, 12-parameter digital card explorer, and interactive record auditor.", href: "/story", icon: BookOpen, status: "verified" as const, stamp: "DIGITAL REGISTRY 05" },
  { title: "Govt citation registry", note: "Review published reports from CPCB, ICAR-NBSS&LUP, CGWB, and MoEFCC.", href: "/sources", icon: Sprout, status: "verified" as const, stamp: "ARCHIVE 06" },
];

export default function Home() {
  const { location } = useLocationStore();

  return (
    <SiteShell title="Home — Soil Pollution Awareness">
      <div className="space-y-12">
        <section data-testid="home-hero" className="grid gap-8 border-b border-ink/15 pb-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:pb-20">
          <div className="flex flex-col justify-end">
            <div data-testid="home-hero-eyebrow" className="mb-5 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span className="h-px w-10 bg-terracotta" /> PAN-INDIA GOVT RECORDS / CPCB & ICAR / {location.state.toUpperCase()}
            </div>
            <h1 data-testid="home-hero-title" className="max-w-4xl font-serif text-3xl sm:text-5xl md:text-6xl lg:text-[6.2rem] font-semibold leading-[0.98] tracking-tight text-ink">
              Trace the story<br /><em className="text-leaf">beneath our feet.</em>
            </h1>
            <p data-testid="home-hero-description" className="mt-5 sm:mt-8 max-w-2xl text-sm sm:text-base leading-relaxed sm:leading-8 text-muted">
              Select any Indian State, District, and City to explore high-resolution satellite imagery, ICAR soil series reports, and CPCB environmental guidelines for <strong>{location.city}, {location.district}</strong>.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
              <Link to="/map" data-testid="home-primary-map-link" className="ink-button bg-leaf text-paper hover:bg-ink justify-center text-xs sm:text-xs py-2.5">
                View Satellite Map & Report <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/story" className="ink-button border border-leaf/40 bg-leaf/10 text-leaf hover:bg-leaf hover:text-paper justify-center text-xs py-2.5">
                Audit Digital Record &rarr;
              </Link>
              <Link to="/survey" data-testid="home-primary-survey-link" className="ink-button border border-ink/25 bg-transparent text-ink hover:border-leaf hover:text-leaf justify-center text-xs py-2.5">
                Open Field Note Survey
              </Link>
            </div>
          </div>

          <div data-testid="home-scope-card" className="ink-frame relative flex min-h-[300px] sm:min-h-[360px] flex-col justify-between overflow-hidden bg-[#e9dfc4] p-4 sm:p-6 dark:bg-[#283128] lg:p-8">
            <div className="absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: "url('https://images.pexels.com/photos/6966593/pexels-photo-6966593.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')", backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden="true" />
            <div className="relative z-10 flex items-start justify-between">
              <span data-testid="home-scope-catalog" className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">[ ACTIVE REGION: {location.city.toUpperCase()} ]</span>
              <EvidenceBadge status="verified" />
            </div>
            <div className="relative z-10 rounded-sm border border-ink/20 bg-paper/85 p-5 backdrop-blur-sm dark:bg-ink/80">
              <p data-testid="home-scope-title" className="font-mono text-xs uppercase tracking-[0.18em] text-terracotta">
                {location.soilType}
              </p>
              <p data-testid="home-scope-copy" className="mt-3 font-serif text-2xl leading-tight text-ink">
                pH {location.pH} &bull; {location.icarStation}
              </p>
              <p data-testid="home-scope-detail" className="mt-3 text-sm leading-6 text-muted">
                {location.reportSummary}
              </p>
            </div>
          </div>
        </section>

        {/* Pan-India Location Context Selector */}
        <section className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-wider text-terracotta">Select Your Region to Customize Reports & Satellite Map:</p>
          <LocationSelector />
        </section>

        <section data-testid="home-method-section" className="grid gap-8 border-b border-ink/15 py-12 lg:grid-cols-[0.55fr_1fr] lg:py-16">
          <div>
            <p data-testid="home-method-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">01 / how to use this notebook</p>
            <h2 data-testid="home-method-title" className="mt-3 max-w-sm font-serif text-4xl leading-tight">Learn first.<br />Question the record.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {["Select Your Region", "View Satellite Imagery", "Inspect ICAR & CPCB Report"].map((title, index) => (
              <div key={title} data-testid={`home-method-step-${index + 1}`} className="border-t-2 border-leaf pt-4">
                <span className="font-mono text-xs text-terracotta">0{index + 1}</span>
                <h3 className="mt-4 font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {[
                    "Choose any State, District, and City in India from the dropdown selector.",
                    "Explore high-resolution satellite imagery overlayed with CPCB monitoring reference points.",
                    "Access personalized soil profile summaries, pH ratings, and NPK nutrient parameters."
                  ][index]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="experiences-section" className="py-12 lg:py-16">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p data-testid="experiences-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">02 / field experiences</p>
              <h2 data-testid="experiences-title" className="mt-2 font-serif text-4xl">Choose your next trace.</h2>
            </div>
            <p data-testid="experiences-note" className="max-w-sm text-sm leading-6 text-muted">Seven doors into soil science, customized for {location.city}.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map(({ title, note, href, icon: Icon, status, stamp }, index) => (
              <Link
                to={href}
                key={href}
                data-testid={`experience-card-${index + 1}`}
                className={`ink-frame group flex min-h-[220px] flex-col justify-between p-5 transition-transform duration-300 hover:-translate-y-1 ${
                  index === 0 ? "bg-leaf text-paper" : "bg-paper dark:bg-paper/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <Icon size={22} aria-hidden="true" className={index === 0 ? "text-paper/80" : "text-leaf"} />
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${index === 0 ? "text-paper/65" : "text-muted"}`}>{stamp}</span>
                </div>
                <div>
                  <EvidenceBadge status={status} />
                  <h3 data-testid={`experience-title-${index + 1}`} className="mt-4 font-serif text-2xl leading-tight">{title}</h3>
                  <p data-testid={`experience-note-${index + 1}`} className={`mt-2 text-sm leading-6 ${index === 0 ? "text-paper/75" : "text-muted"}`}>{note}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                    Open record <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}

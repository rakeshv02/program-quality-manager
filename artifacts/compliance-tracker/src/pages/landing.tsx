import { Link } from "wouter";
import { Star, Shield, Award, Building2, CheckCircle2, Clock, FileText, BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";

// ─── FAQ data (mirrors JSON-LD in index.html) ──────────────────────────────────

const FAQS = [
  {
    q: "Is it really free? What are the limits?",
    a: "Yes — completely free, no credit card required. The free tier supports up to 12 staff members across 2 locations, includes full certification tracking, training hour monitoring, Texas Rising Star progress, and CSV export.",
  },
  {
    q: "Which TAC chapters does it support?",
    a: "All three Texas childcare licensing chapters: TAC §746 for licensed child care centers, TAC §747 for licensed home-based daycares, and TAC §744 for school-age / before & after school programs. Each program type shows the correct annual training hour requirements and approved staff roles.",
  },
  {
    q: "How does the Texas Rising Star (TRS) tracker work?",
    a: "The Rising Star section calculates your current TRS star level based on staff CPR coverage, First Aid coverage, and CDA credential ratios. It shows your current score and exactly how many points you need to reach the next star level — so you always know where you stand.",
  },
  {
    q: "What certifications does it track?",
    a: "CPR certification, First Aid certification, CDA (Child Development Associate) credentials, and any custom certification type you add. You'll see expiration dates and get 30-day advance warnings so you're never caught off guard during a DFPS licensing inspection.",
  },
  {
    q: "How are training hours tracked?",
    a: "For each staff member you log annual training hours and pre-service hours. A progress bar shows completion toward their role requirement — for example, a Director at a TAC §746 Child Care Center needs 30 annual hours and 24 pre-service hours.",
  },
  {
    q: "Can I manage multiple childcare locations?",
    a: "Yes. The free tier supports up to 2 locations, each with its own program type, staff list, certifications, and training records. Each location can be a different program type — mix a child care center and a licensed home on the same account.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 bg-white border-t border-gray-100">
          <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] font-sans flex flex-col">

      {/* ── Navbar ── */}
      <nav className="w-full bg-[#1F2937] text-white px-6 py-4 flex items-center justify-between shrink-0" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#10B981] flex items-center justify-center shrink-0" aria-hidden="true">
            <Star className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Texas Childcare Advisors</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/demo" className="text-sm font-medium hover:text-gray-300 hidden sm:inline">
            View Demo
          </Link>
          <Link href="/sign-in" className="text-sm font-medium hover:text-gray-300">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-medium bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-md transition-colors">
            Start Free
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">

        {/* ── Hero ── */}
        <section className="px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-emerald-200">
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
            Free staff certification tracker · No credit card required
          </div>

          {/* H1 — primary keyword target */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 max-w-4xl">
            Free Staff Certification Tracker for Texas Childcare Programs
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-4 max-w-2xl">
            Track CPR, First Aid, and CDA certifications. Monitor annual training hours. Stay ahead of your Texas Rising Star rating — all in one place.
          </p>
          <p className="text-sm text-gray-500 mb-10 max-w-xl">
            Supports TAC §746 child care centers, TAC §747 licensed homes, and TAC §744 school-age programs.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/sign-up"
              className="text-base font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3.5 rounded-lg transition-colors shadow-sm"
            >
              Start Free — Up to 12 Staff
            </Link>
            <Link
              href="/demo"
              className="text-base font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-8 py-3.5 rounded-lg transition-colors"
            >
              View Live Demo
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" />No spreadsheet setup</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" />DFPS inspection ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Rising Star progress built in</span>
          </div>
        </section>

        {/* ── Core Features ── */}
        <section className="px-6 py-16 bg-white border-y border-gray-200" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="features-heading" className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
              Everything a Texas childcare director needs
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
              Built specifically for Texas licensing requirements — not a generic HR tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-green-100 text-green-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Certification Expiry Alerts</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Track CPR, First Aid, and CDA expiration dates. Get 30-day advance warnings so you're always audit-ready for DFPS inspections. Never scramble to find who's current.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Texas Rising Star Progress</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  See your current TRS star level and the exact points needed to reach 2-star, 3-star, or 4-star. Works for childcare centers and licensed homes eligible under TAC §746 and §747.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Training Hour Tracking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Log annual training hours and pre-service hours per staff member. Progress bars show completion toward role-specific requirements under TAC §746, §747, and §744.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-Location Management</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Run multiple centers, a home and a center, or any combination. Each location has its own program type, staff list, and quality dashboard. Free tier supports 2 locations.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Reports &amp; CSV Export</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Generate staff certification reports by location. Export to CSV for your records, licensing audits, or parent handbook documentation.
                </p>
              </div>

              <div className="flex flex-col items-start p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="w-11 h-11 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center mb-5" aria-hidden="true">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Texas-Specific Requirements</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Role-based training requirements pre-loaded for directors, lead teachers, caregivers, and aides — per TAC chapter. No manual lookup needed when adding staff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Program Types ── */}
        <section className="px-6 py-16 bg-[#F9FAFB]" aria-labelledby="program-types-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="program-types-heading" className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
              Supports all three Texas childcare program types
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
              Select your program type and every training requirement, staff role, and quality metric updates automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="bg-white rounded-xl border-2 border-blue-100 p-6">
                <div className="inline-block bg-blue-50 text-blue-700 text-xs font-mono font-bold px-2 py-1 rounded border border-blue-200 mb-4">TAC §746</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Child Care Centers</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Licensed child care centers under Texas Administrative Code Title 40, Chapter 746. Tracks director (30 hrs/yr), lead teacher (24 hrs/yr), and aide requirements.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />Director: 30 annual / 24 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />Lead Teacher: 24 annual / 24 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />Texas Rising Star eligible</li>
                </ul>
              </article>

              <article className="bg-white rounded-xl border-2 border-emerald-100 p-6">
                <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-mono font-bold px-2 py-1 rounded border border-emerald-200 mb-4">TAC §747</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Licensed Home-Based Daycares</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Licensed home-based childcare providers under TAC Chapter 747. Tracks primary caregiver (30 hrs/yr) and assistant caregiver requirements.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Primary Caregiver: 30 annual / 24 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Assistant Caregiver: 24 annual / 24 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />Texas Rising Star eligible</li>
                </ul>
              </article>

              <article className="bg-white rounded-xl border-2 border-violet-100 p-6">
                <div className="inline-block bg-violet-50 text-violet-700 text-xs font-mono font-bold px-2 py-1 rounded border border-violet-200 mb-4">TAC §744</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">School-Age Programs</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Before and after school programs under TAC Chapter 744. Reduced training hour requirements specifically for school-age childcare program staff.
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />Program Director: 20 annual / 8 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />Caregiver: 15 annual / 8 pre-service hrs</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />PQA quality framework supported</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="px-6 py-16 bg-white border-y border-gray-200" aria-labelledby="testimonials-heading">
          <div className="max-w-6xl mx-auto">
            <h2 id="testimonials-heading" className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-10">
              Trusted by Texas childcare directors and program managers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <blockquote className="bg-gray-50 p-7 rounded-xl border border-gray-100">
                <p className="text-gray-700 mb-5 italic text-sm leading-relaxed">
                  "This replaced our messy binder system entirely. I check the dashboard every Monday morning and know exactly who needs a renewal."
                </p>
                <footer>
                  <p className="font-bold text-gray-900 text-sm">Sarah Jenkins</p>
                  <p className="text-xs text-gray-500">Director, Child Care Center · Austin, TX</p>
                </footer>
              </blockquote>
              <blockquote className="bg-gray-50 p-7 rounded-xl border border-gray-100">
                <p className="text-gray-700 mb-5 italic text-sm leading-relaxed">
                  "The 30-day warnings save us during licensing visits. We are always ahead of the curve. No more last-minute CPR scrambles."
                </p>
                <footer>
                  <p className="font-bold text-gray-900 text-sm">Marcus Cole</p>
                  <p className="text-xs text-gray-500">Owner, Licensed Home-Based Daycare · Dallas, TX</p>
                </footer>
              </blockquote>
              <blockquote className="bg-gray-50 p-7 rounded-xl border border-gray-100">
                <p className="text-gray-700 mb-5 italic text-sm leading-relaxed">
                  "Helped us see exactly what we needed to hit our 3-star Rising Star rating. Invaluable staff certification tracking tool."
                </p>
                <footer>
                  <p className="font-bold text-gray-900 text-sm">Elena Rostova</p>
                  <p className="text-xs text-gray-500">Program Director, School-Age Program · Houston, TX</p>
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="px-6 py-16 bg-[#F9FAFB]" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
              Frequently asked questions
            </h2>
            <p className="text-gray-500 text-center mb-10">
              Everything you need to know about the free staff certification tracker.
            </p>
            <div className="space-y-3">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="bg-[#1F2937] text-white py-20 px-6 text-center" aria-labelledby="cta-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-4">
              Start tracking staff certifications today
            </h2>
            <p className="text-lg text-gray-400 mb-3">
              Free program quality manager for Texas childcare centers, licensed homes, and school-age programs.
            </p>
            <p className="text-sm text-gray-500 mb-10">
              Free tier: 12 staff · 2 locations · CSV export · No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-block text-base font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3.5 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/demo"
                className="inline-block text-base font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-8 py-3.5 rounded-lg transition-colors"
              >
                See Live Demo First
              </Link>
            </div>
            <p className="mt-8 text-xs text-gray-600">
              Covers TAC §746 · TAC §747 · TAC §744 · Texas Rising Star · DFPS licensing requirements
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#111827] text-gray-500 px-6 py-8 text-center text-xs">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Texas Childcare Advisors. Program Quality Manager — free staff certification tracker for Texas childcare.</p>
            <nav aria-label="Footer navigation" className="flex items-center gap-4">
              <Link href="/demo" className="hover:text-gray-300 transition-colors">Demo</Link>
              <Link href="/sign-in" className="hover:text-gray-300 transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-gray-300 transition-colors">Sign Up</Link>
            </nav>
          </div>
        </footer>

      </main>
    </div>
  );
}

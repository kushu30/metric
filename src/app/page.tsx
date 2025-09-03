import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-stretch">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_50%,#111827_0%,#000000_60%)]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:"url('/window.svg')", backgroundRepeat:'no-repeat', backgroundPosition:'center right'}} />
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_10%,rgba(16,185,129,.20),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(99,102,241,.18),transparent_45%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-3xl pt-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              live on testnet — invite only
            </div>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl sm:text-7xl leading-tight tracking-tight">
              crafted for the creditworthy
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              The private credit network for principled borrowers and discerning lenders. Machine-evaluated risk. Community-backed insurance. Radical transparency.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-black hover:bg-white/90">Get started</Button>
              </Link>
              <Link href="#learn">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">Learn more</Button>
              </Link>
            </div>
            <div className="mt-16 flex items-center gap-3 text-white/50">
              <div className="h-px w-10 bg-white/20" />
              <span className="text-sm">scroll to explore</span>
            </div>
          </div>
        </div>

        {/* subtle glows */}
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      </section>

      {/* Comparison Section (moved up) */}
      <section className="relative border-t border-white/10">
        <div className="absolute inset-0 pointer-events-none [background-image:radial-gradient(400px_200px_at_20%_20%,rgba(16,185,129,.06),transparent),radial-gradient(500px_240px_at_80%_80%,rgba(99,102,241,.06),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <h2 className="font-[var(--font-display)] text-3xl sm:text-5xl text-center mb-12">choose your edge</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'for borrowers',
                items: ['personalized APR from behavior signals','instant disbursals on approval','clear amortization, zero hidden fees','rewards that grow with your score'],
                cta: { href: '/dashboard', label: 'Start borrowing' }
              },
              {
                title: 'for lenders',
                items: ['pool-level risk controls','capital protection via insurance','transparent performance dashboards','automated repayments & alerts'],
                cta: { href: '/lender-dashboard', label: 'Start lending' }
              }
            ].map((col) => (
              <div key={col.title} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl capitalize">{col.title}</h3>
                  <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center group-hover:bg-white/20 transition-colors">
                    <span className="text-white/70">→</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 text-white/80">
                  {col.items.map((i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href={col.cta.href}>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      {col.cta.label}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="relative border-t border-white/10">
        <div className="absolute inset-0 pointer-events-none [background-image:radial-gradient(500px_200px_at_50%_0%,rgba(255,255,255,.04),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{
              title: 'Risk scored by ML',
              desc: 'Fair, behavior-driven underwriting for real risk.',
            },{
              title: 'Insurance-backed pools',
              desc: 'Capital protection with transparent claims logic.',
            },{
              title: 'On-chain clarity',
              desc: 'Auditable performance and automated settlements.',
            }].map((f)=> (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                <div className="text-sm text-white/60">{f.title}</div>
                <div className="mt-2 text-white/80">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Row */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{
            kpi: '50ms', label: 'risk compute latency'
          },{ kpi: '0.00%', label: 'protocol fee on repayments' },{ kpi: '99.9%', label: 'on-chain uptime' },{ kpi: 'AES-256', label: 'at-rest encryption' }].map(({kpi,label})=> (
            <div key={label} className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-semibold">{kpi}</span>
              <span className="text-sm text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mini Lender vs Borrower comparison (near top) */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-2 gap-4">
            {[{
              title: 'Borrowers',
              items: ['Personalized APR', 'Instant disbursal', 'Transparent amortization'],
              href: '/dashboard',
              cta: 'Borrow now'
            },{
              title: 'Lenders',
              items: ['Risk-managed pools', 'Insurance-backed capital', 'Clear performance'],
              href: '/lender-dashboard',
              cta: 'Lend now'
            }].map((side) => (
              <div key={side.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-transform duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{side.title}</h3>
                  <Link href={side.href} className="text-sm text-white/80 hover:text-white">
                    {side.cta} →
                  </Link>
                </div>
                <ul className="mt-3 text-sm text-white/80 space-y-2">
                  {side.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos Row — removed for a cleaner, more premium feel */}

      {/* Section 1 */}
      <section id="learn" className="relative border-t border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_25%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-6xl leading-tight">
              do more with your credit
            </h2>
            <p className="mt-6 text-white/70 max-w-xl">
              Manage loans smartly, uncover fees, track insights, and maximize rewards. Our scoring evolves with your behavior to unlock fairer rates.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-white/80">
              {["ML risk engine","Insurance pool","On-chain audits","Instant payouts"].map((label)=> (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-first md:order-last">
            <div className="relative rounded-2xl h-72 sm:h-96 w-full border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(500px_200px_at_30%_30%,rgba(16,185,129,0.25),transparent),radial-gradient(600px_250px_at_70%_70%,rgba(99,102,241,0.25),transparent)]" />
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url('/window.svg')", backgroundRepeat:'no-repeat', backgroundPosition:'center'}} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="relative border-t border-white/10">
        <div className="relative max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative rounded-2xl h-72 sm:h-96 w-full border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(700px_260px_at_60%_40%,rgba(99,102,241,0.30),transparent)]" />
              <div className="absolute -inset-10 opacity-[0.08]" style={{backgroundImage:"url('/globe.svg')", backgroundRepeat:'no-repeat', backgroundPosition:'center'}} />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-[var(--font-display)] text-4xl sm:text-6xl leading-tight">
              feel the odds fall in your favor
            </h2>
            <p className="mt-6 text-white/70 max-w-xl">
              Earn cashback, exclusive rewards, and access curated experiences when you repay on time and keep your score high.
            </p>
            <div className="mt-8">
              <Link href="/lender-dashboard">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">For lenders</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section — moved up above */}

      {/* Testimonial — removed to reduce noise and focus on the product */}

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_120%,rgba(16,185,129,0.12),rgba(99,102,241,0.10),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h3 className="font-[var(--font-display)] text-4xl sm:text-5xl">fund the future of fair credit</h3>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Join as an early partner and help shape a resilient, transparent credit ecosystem.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/select-role">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">Request access</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating QR card — removed per request */}
    </div>
  );
}



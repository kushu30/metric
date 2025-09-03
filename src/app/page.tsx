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
              Powered by MTRC on Sepolia Testnet
            </div>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl sm:text-7xl leading-tight tracking-tight">
              Smarter credit for the verified individual.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              Metric is a private credit network where your identity and reputation unlock borrowing power. Backed by community insurance and radical transparency.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-black hover:bg-white/90">Get started</Button>
              </Link>
              <Link href="#learn">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">Learn more</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative border-t border-white/10">
        <div className="absolute inset-0 pointer-events-none [background-image:radial-gradient(400px_200px_at_20%_20%,rgba(16,185,129,.06),transparent),radial-gradient(500px_240px_at_80%_80%,rgba(99,102,241,.06),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <h2 className="font-[var(--font-display)] text-3xl sm:text-5xl text-center mb-12">An ecosystem built on trust.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'For Borrowers',
                items: ['Unlock higher loans with identity verification','Build your on-chain credit score','Access instant, transparent financing','Operate with our native MTRC token'],
                cta: { href: '/dashboard', label: 'Start Borrowing' }
              },
              {
                title: 'For Lenders',
                items: ['Fund loans backed by collateral and identity','Earn yield with community-insured protection','View transparent borrower risk profiles','Automated repayments & alerts'],
                cta: { href: '/lender-dashboard', label: 'Start Lending' }
              }
            ].map((col) => (
              <div key={col.title} className="group rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl capitalize">{col.title}</h3>
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
      
      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_120%,rgba(16,185,129,0.12),rgba(99,102,241,0.10),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h3 className="font-[var(--font-display)] text-4xl sm:text-5xl">Join the future of fair credit.</h3>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Become an early member of a more secure, transparent, and community-driven financial ecosystem.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/select-role">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">Request Access</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
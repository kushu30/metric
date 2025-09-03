import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
// We remove the Header from here

export default function HomePage() {
  return (
    // The <Header/> is removed from this file.
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full text-center py-20 sm:py-32 bg-gray-50">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-800 tracking-tight">
          Decentralized Fair Lending
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
          Leveraging ML-driven credit scoring and a community-backed insurance pool to provide transparent and equitable loans for everyone.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Metric?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader><CardTitle>ML-Powered Risk Analysis</CardTitle></CardHeader>
              <CardContent>Our proprietary model provides a fair, unbiased credit score, opening up opportunities for more borrowers.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Insured by the Community</CardTitle></CardHeader>
              <CardContent>Lenders are protected by a decentralized insurance pool that automatically compensates for defaults.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Transparent & On-Chain</CardTitle></CardHeader>
              <CardContent>Every transaction is recorded and verifiable, ensuring complete transparency and trust in the platform.</CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
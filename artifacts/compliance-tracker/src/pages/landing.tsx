import { Link } from "wouter";
import { Star, Shield, Award, Building2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] font-sans flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-[#1F2937] text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#10B981] flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Texas Childcare Advisors</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-gray-300">
            Sign In
          </Link>
          <Link href="/sign-up" className="text-sm font-medium bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-md transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="px-6 py-24 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Keep Your Daycare Centers Audit-Ready
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl">
            Track staff certifications, get 30-day expiration alerts, and stay Rising Star compliant — without the spreadsheet chaos.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/demo" className="text-base font-medium bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3 rounded-md transition-colors">
              View Demo
            </Link>
            <Link href="/sign-up" className="text-base font-medium bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-md transition-colors">
              Start Free Trial
            </Link>
          </div>
        </section>

        {/* Value Props */}
        <section className="px-6 py-16 bg-white border-y border-gray-200">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Never Miss an Expiration</h3>
              <p className="text-gray-600">
                Track CPR, First Aid, CDA and get 30-day alerts before certifications expire.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rising Star Ready</h3>
              <p className="text-gray-600">
                See exactly what you need for 2-star, 3-star, and 4-star certification at a glance.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Location</h3>
              <p className="text-gray-600">
                Manage up to 3 centers from one dashboard with location-specific reporting.
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="px-6 py-20 bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-12">
              Trusted by Texas daycare directors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-700 mb-6 italic">"This replaced our messy binder system entirely. I check the dashboard every Monday morning."</p>
                <div>
                  <p className="font-bold text-gray-900">Sarah Jenkins</p>
                  <p className="text-sm text-gray-500">Director, Austin</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-700 mb-6 italic">"The 30-day warnings save us during licensing visits. We are always ahead of the curve now."</p>
                <div>
                  <p className="font-bold text-gray-900">Marcus Cole</p>
                  <p className="text-sm text-gray-500">Owner, Dallas</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-700 mb-6 italic">"Helped us see exactly what we needed to hit our 3-star rating for Rising Star. Invaluable tool."</p>
                <div>
                  <p className="font-bold text-gray-900">Elena Rostova</p>
                  <p className="text-sm text-gray-500">Director, Houston</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-[#1F2937] text-white py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get compliant?</h2>
            <p className="text-lg text-gray-400 mb-10">
              Free tier: 15 staff, 3 locations, CSV export — no credit card required.
            </p>
            <Link href="/sign-up" className="inline-block text-base font-medium bg-[#10B981] hover:bg-[#059669] text-white px-8 py-3 rounded-md transition-colors">
              Start Free Trial
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

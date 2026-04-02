import Link from "next/link";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

const programs = [
  { title: "Pilot Training", desc: "CPL and ATPL programs with state-of-the-art flight simulators and aircraft fleet.", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  { title: "Aircraft Maintenance", desc: "EASA Part-66 approved AME training for B1 and B2 licensed engineers.", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { title: "Air Traffic Control", desc: "ICAO-compliant ATC training with radar and tower simulation environments.", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
  { title: "Aviation Meteorology", desc: "Weather observation and forecasting for aviation safety and operations.", icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" },
  { title: "Airport Operations", desc: "Ground handling, safety management systems, and airport administration.", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { title: "Flight Dispatch", desc: "Flight planning, navigation, performance analysis and operational control.", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
];

const stats = [
  { value: "1977", label: "Established" },
  { value: "6+", label: "Programs" },
  { value: "ICAO", label: "Certified" },
  { value: "Gulf's #1", label: "Aviation Academy" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <TopNav />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-qaa-navy-950 via-qaa-navy-900 to-qaa-navy-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-qaa-gold-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-qaa-navy-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1 bg-qaa-gold-500/20 border border-qaa-gold-500/30 rounded-full text-qaa-gold-400 text-xs font-medium mb-6">
              Where Excellence Becomes Reality
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Qatar Aeronautical
              <span className="text-qaa-gold-400"> Academy</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl">
              The Gulf region&apos;s premier aviation training institution. Offering world-class
              programs in pilot training, aircraft maintenance, air traffic control, and more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#programs"
                className="px-6 py-3 bg-qaa-gold-500 text-qaa-navy-950 font-semibold rounded-lg hover:bg-qaa-gold-400 transition"
              >
                Explore Programs
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-qaa-navy-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="bg-qaa-navy-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-qaa-navy-900">Our Programs</h2>
            <p className="text-gray-500 mt-2">World-class aviation training programs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-qaa-gold-300 transition group"
              >
                <div className="w-12 h-12 bg-qaa-navy-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-qaa-gold-100 transition">
                  <svg className="w-6 h-6 text-qaa-navy-600 group-hover:text-qaa-gold-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-qaa-navy-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-qaa-navy-900">Contact Us</h2>
            <p className="text-gray-500 mt-2">Get in touch with our admissions team</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-qaa-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-qaa-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <p className="font-medium text-qaa-navy-900 text-sm">+974 4452 9000</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-qaa-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-qaa-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="font-medium text-qaa-navy-900 text-sm">info@qaa.edu.qa</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-qaa-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-qaa-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="font-medium text-qaa-navy-900 text-sm">Doha, Qatar</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

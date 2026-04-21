// app/about/page.tsx
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Building the future of <span className="text-blue-400">Education</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Our mission is to empower every student and teacher with the tools they need to share information and stay connected in the digital age.
          </p>
        </div>
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          {/* Image Placeholder */}
          <div className="relative h-[400px] w-full bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
             <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic">
               [Team Photo / Office Image]
             </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Our Story</h2>
            <p className="text-slate-600 leading-relaxed">
              Founded in 2024, Daily Pulse started as a simple idea in a classroom. We realized that information often gets lost in long email chains and messy group chats.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We built a centralized board where announcements are clear, feedback is instant, and everyone stays in the loop—no matter where they are.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div>
                <p className="text-3xl font-bold text-blue-600">500+</p>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">24/7</p>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Real-time Updates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-50 py-16 px-4 text-center border-t border-slate-200">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Want to join our journey?</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md">
          Contact Us
        </button>
      </section>
    </div>
  );
}

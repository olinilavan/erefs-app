import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-5 max-w-6xl mx-auto">
        <span className="text-2xl font-bold tracking-tight">eRefs<span className="text-indigo-300">.ai</span></span>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 rounded-lg hover:bg-white/10 transition">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-indigo-100 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block px-4 py-1 bg-indigo-500/30 rounded-full text-indigo-200 text-sm font-medium mb-6">
          Elite Referral Automation
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Turn referrals from a favor into a <span className="text-indigo-300">data-driven signal</span>
        </h1>
        <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
          Automate the entire reference process — from collecting structured feedback to generating AI-powered analytics reports in minutes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register?role=jobseeker" className="px-6 py-3 bg-white text-indigo-900 rounded-lg font-semibold hover:bg-indigo-100 transition">
            I'm a Job Seeker
          </Link>
          <Link to="/register?role=employer" className="px-6 py-3 border border-white/40 rounded-lg font-semibold hover:bg-white/10 transition">
            I'm an Employer
          </Link>
        </div>
      </main>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-8 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: '📋', title: '10 Structured Questions', desc: 'Standardized questionnaire covering performance, teamwork, communication, and growth.' },
          { icon: '🤖', title: 'AI-Powered Reports', desc: 'Claude analyzes all responses and generates an executive summary, scores, and key insights.' },
          { icon: '🔗', title: 'Shareable in One Click', desc: 'Share a professional reference report with any employer via a secure link.' },
        ].map(f => (
          <div key={f.title} className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-indigo-200 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-100 max-w-6xl mx-auto">
        <Logo to="/" height={100} />
        <div className="flex gap-4 text-sm">
          <Link to="/login" className="text-gray-500 hover:text-teal-700">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">Get Started Free</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-14">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: October 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>VouchMetrics ("we", "us", "our") operates the VouchMetrics platform at vouchmetrics.com. We provide AI-assisted reference checking, background screening, job posting, and staffing vendor collaboration tools for employers and job seekers.</p>
            <p className="mt-2">For questions about this policy, contact us at <a href="mailto:admin@vouchmetrics.com" className="text-teal-600 hover:underline">admin@vouchmetrics.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. What data we collect</h2>
            <p className="font-medium text-gray-800 mb-1">Account data</p>
            <p>Name, email address, password (hashed), company name, professional headline, and profile photo (if you sign in via Google or LinkedIn).</p>
            <p className="font-medium text-gray-800 mt-4 mb-1">Reference and background check data</p>
            <p>Candidate names, email addresses, professional history, and answers submitted by references during a reference check. For background checks: employment history, education records, and criminal check consent where applicable.</p>
            <p className="font-medium text-gray-800 mt-4 mb-1">Job and application data</p>
            <p>Job postings, applications, resumes, cover notes, and AI-generated fit scores associated with specific roles.</p>
            <p className="font-medium text-gray-800 mt-4 mb-1">Usage data</p>
            <p>Pages visited, actions taken, and timestamps for the purpose of improving the platform. We use structured server logs; we do not use third-party analytics trackers.</p>
            <p className="font-medium text-gray-800 mt-4 mb-1">Communications</p>
            <p>Messages sent through our demo request form or chat widget.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide the platform services you signed up for</li>
              <li>To send transactional emails (invite links, verification emails, reference request notifications)</li>
              <li>To generate AI-assisted reference reports using Groq's language model API</li>
              <li>To improve our platform based on aggregated, anonymised usage patterns</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. AI processing</h2>
            <p>Reference responses and candidate summaries are processed by a large language model (Groq API) to generate structured reports and fit scores. This processing is limited to the content you or your references submit. AI-generated scores are advisory only and are not a hiring decision. No personal data is used to train external AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data sharing</h2>
            <p>We share data only as necessary to operate the platform:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Groq</strong> — processes reference text to generate AI reports</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Railway</strong> — cloud infrastructure and database hosting</li>
              <li><strong>Vercel</strong> — frontend hosting</li>
            </ul>
            <p className="mt-3">All sub-processors are contractually bound to handle data securely and only for the stated purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data retention</h2>
            <p>We retain your account and associated data for as long as your account is active. Reference check data and reports are retained for the period set by the requesting employer (default: 14 days for share links, account data until deletion). You may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your rights</h2>
            <p>You have the right to access, correct, export, or delete your personal data. To exercise any of these rights, email <a href="mailto:admin@vouchmetrics.com" className="text-teal-600 hover:underline">admin@vouchmetrics.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. Passwords are hashed using bcrypt and never stored in plain text. Access to production data is restricted to authorised personnel only.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>We use localStorage (not cookies) to store your authentication token and session preferences. We do not set third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to this policy</h2>
            <p>We may update this policy as the platform evolves. We will notify registered users of material changes by email. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-8 mt-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-400">
          <Logo height={28} />
          <div className="flex gap-4">
            <span>© {new Date().getFullYear()} VouchMetrics · A product of <a href="https://onrsys.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition">ONR Systems</a></span>
            <Link to="/terms" className="hover:text-gray-600 transition">Terms & Conditions</Link>
            <Link to="/demo" className="hover:text-gray-600 transition">Book a Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];

export default function DemoRequest() {
  const [type, setType] = useState('demo');
  const [form, setForm] = useState({
    name: '', email: '', company: '', jobTitle: '', teamSize: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/api/demo', { enquiryType: type, ...form });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">We've received your request</h2>
          <p className="text-gray-500 text-sm mb-6">
            Our team will be in touch within 1–2 business days. Check your inbox for a confirmation email.
          </p>
          <Link to="/" className="text-indigo-600 text-sm font-medium hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg w-full">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-indigo-600 hover:underline">&larr; Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Get in touch</h1>
          <p className="text-gray-500 text-sm mt-1">Tell us a bit about yourself and we'll reach out shortly.</p>
        </div>

        {/* Type toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
          {[
            { value: 'demo', label: 'Book a Demo' },
            { value: 'enquiry', label: 'Business Enquiry' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={set('name')}
                placeholder="Jane Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Work email <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="jane@company.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={set('company')}
                placeholder="Acme Corp"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Job title</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={set('jobTitle')}
                placeholder="HR Manager"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Team size</label>
            <select
              value={form.teamSize}
              onChange={set('teamSize')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select…</option>
              {TEAM_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {type === 'demo' ? 'What would you like to see in the demo?' : 'How can we help?'}
            </label>
            <textarea
              rows={4}
              value={form.message}
              onChange={set('message')}
              placeholder={type === 'demo'
                ? 'e.g. background checks, vendor network, workforce management…'
                : "Tell us about your use case or what you're looking for…"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Submitting…' : type === 'demo' ? 'Request a Demo' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}

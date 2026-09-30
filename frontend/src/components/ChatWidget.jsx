import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STORAGE_KEY = 'vm_chat_session';
const PRIVACY_KEY = 'vm_chat_privacy_seen';

const SUGGESTED = [
  'What is VouchMetrics?',
  'How do background checks work?',
  'Can I try it for free?',
  'How do I book a demo?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [privacySeen, setPrivacySeen] = useState(() => !!localStorage.getItem(PRIVACY_KEY));
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m the VouchMetrics assistant. Ask me anything about the platform, or pick a question below.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function acceptPrivacy() {
    localStorage.setItem(PRIVACY_KEY, '1');
    setPrivacySeen(true);
  }

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY) || undefined;
      const { data } = await api.post('/api/chat/message', {
        sessionToken: token,
        message: msg,
        pageUrl: window.location.pathname,
      });
      if (data.sessionToken) localStorage.setItem(STORAGE_KEY, data.sessionToken);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble responding right now. Please try again shortly.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        aria-label="Open chat"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '520px' }}>

          {/* Header */}
          <div className="bg-teal-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center text-sm font-bold">V</div>
            <div>
              <div className="font-semibold text-sm">VouchMetrics Assistant</div>
              <div className="text-xs text-teal-200">Ask me anything about the platform</div>
            </div>
          </div>

          {/* Privacy notice */}
          {!privacySeen && (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-xs text-amber-800 shrink-0">
              <p className="font-medium mb-1">Privacy notice</p>
              <p>Conversations are stored to help improve VouchMetrics support. Please don't share passwords or payment details.</p>
              <button onClick={acceptPrivacy}
                className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1 rounded-lg font-medium transition">
                Got it
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions — show only at start */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100 rounded-full px-3 py-1 transition">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo CTA */}
          <div className="px-4 pb-2 shrink-0">
            <Link to="/demo"
              className="block text-center text-xs text-teal-600 hover:text-teal-800 font-medium py-1.5 border border-teal-100 rounded-xl hover:bg-teal-50 transition">
              Book a demo with the team →
            </Link>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question…"
                maxLength={1000}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button type="submit" disabled={!input.trim() || loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl px-3 py-2 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

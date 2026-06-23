import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { normalizeUrl } from '../utils/url';

export default function Report() {
  const { id } = useParams();
  const { user } = useAuth();
  const dashboardPath = user?.is_admin ? '/admin' : user?.role === 'employer' ? '/employer/dashboard' : '/dashboard';
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/api/reports/${id}`).then(r => setReport(r.data));
  }, [id]);

  if (!report) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading report...</div>;

  const data = report.llm_output_json;
  const radarData = [
    { subject: 'Performance', score: data.scores.overallPerformance },
    { subject: 'Teamwork', score: data.scores.teamwork },
    { subject: 'Communication', score: data.scores.communication },
    { subject: 'Problem Solving', score: data.scores.problemSolving },
    { subject: 'Leadership', score: data.scores.leadership },
  ];

  const shareUrl = `${window.location.origin}/report/share/${report.share_token}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <Link to={dashboardPath} className="text-xl font-bold text-teal-700">← Dashboard</Link>
        <button onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
          📋 Copy Share Link
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">Reference Report</h1>
              <p className="text-gray-500">{new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-center bg-teal-50 rounded-xl px-6 py-3">
              <div className="text-3xl font-bold text-teal-700">{data.confidenceScore}%</div>
              <div className="text-xs text-gray-500 mt-1">Confidence Score</div>
            </div>
          </div>

          <div className="mt-6 bg-teal-50 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-2">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed">{data.executiveSummary}</p>
          </div>

          {report.resume_url && (
            <a href={normalizeUrl(report.resume_url)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline mt-4">
              📄 View Resume →
            </a>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="font-semibold text-gray-800 mb-6">Competency Scores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar name="Score" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
              <Tooltip formatter={v => [`${v}/5`]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths + Development */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">💪 Key Strengths</h2>
            <ul className="space-y-2">
              {data.keyStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">📈 Areas for Development</h2>
            <ul className="space-y-2">
              {data.areasForDevelopment.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="text-yellow-500 mt-0.5">→</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Culture fit + Rehire signal */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">🏢 Culture & Role Fit</h2>
            <p className="text-gray-700 text-sm">{data.cultureFit}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">🔄 Rehire Signal</h2>
            <div className="flex gap-6 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.rehireSignal.yes}</div>
                <div className="text-xs text-gray-500">Would Rehire</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{data.rehireSignal.no}</div>
                <div className="text-xs text-gray-500">Would Not</div>
              </div>
            </div>
            <p className="text-gray-700 text-sm">{data.rehireSignal.context}</p>
          </div>
        </div>

        {/* Notable Quotes */}
        {data.notableQuotes?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="font-semibold text-gray-800 mb-4">💬 Notable Quotes</h2>
            <div className="space-y-4">
              {data.notableQuotes.map((q, i) => (
                <blockquote key={i} className="border-l-4 border-teal-300 pl-4 text-gray-600 italic">"{q}"</blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Professional Profile */}
        {report.linkedin_analysis_json && <ProfileSection p={report.linkedin_analysis_json} url={report.candidate_linkedin_url} />}
      </main>
    </div>
  );
}

function ProfileSection({ p, url }) {
  const strengthColor = { Beginner: 'text-gray-500', Intermediate: 'text-blue-600', Advanced: 'text-teal-600', Expert: 'text-indigo-600' };
  const scoreColor = p.profileScore >= 80 ? 'text-teal-700' : p.profileScore >= 60 ? 'text-blue-700' : 'text-yellow-700';
  const scoreBg = p.profileScore >= 80 ? 'bg-teal-50' : p.profileScore >= 60 ? 'bg-blue-50' : 'bg-yellow-50';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">Professional Profile</h2>
          {url && (
            <a href={normalizeUrl(url)} target="_blank" rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:underline mt-0.5 block">View LinkedIn →</a>
          )}
        </div>
        <div className={`text-center ${scoreBg} rounded-xl px-5 py-3`}>
          <div className={`text-3xl font-bold ${scoreColor}`}>{p.profileScore}</div>
          <div className="text-xs text-gray-500 mt-1">Profile Score</div>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-6">{p.summary}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {(p.currentTitle || p.currentCompany) && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Role</div>
              <div className="text-sm text-gray-800 font-medium">{p.currentTitle}</div>
              {p.currentCompany && <div className="text-sm text-gray-600">{p.currentCompany}</div>}
            </div>
          )}
          {p.experienceYears != null && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Experience</div>
              <div className="text-sm text-gray-800">{p.experienceYears} year{p.experienceYears !== 1 ? 's' : ''}</div>
            </div>
          )}
          {p.profileStrength && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Profile Strength</div>
              <div className={`text-sm font-semibold ${strengthColor[p.profileStrength] || 'text-gray-700'}`}>{p.profileStrength}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {p.topSkills?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Top Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {p.topSkills.map((s, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}
          {p.educationHighlights?.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Education</div>
              <ul className="space-y-0.5">
                {p.educationHighlights.map((e, i) => (
                  <li key={i} className="text-sm text-gray-700">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {p.careerTrajectory && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Career Trajectory</div>
          <p className="text-sm text-gray-700">{p.careerTrajectory}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
        Based on information the candidate shared directly — not independently verified.
      </p>
    </div>
  );
}

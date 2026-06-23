import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import Logo from '../components/Logo';
import { normalizeUrl } from '../utils/url';

function ReportBlock({ data, referrerName, createdAt }) {
  const radarData = [
    { subject: 'Performance', score: data.scores.overallPerformance },
    { subject: 'Teamwork', score: data.scores.teamwork },
    { subject: 'Communication', score: data.scores.communication },
    { subject: 'Problem Solving', score: data.scores.problemSolving },
    { subject: 'Leadership', score: data.scores.leadership },
  ];

  return (
    <div className="space-y-5 mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Reference from {referrerName}</h2>
        <span className="text-xs text-gray-400">{new Date(createdAt).toLocaleDateString()}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-800">Executive Summary</h3>
          <div className="text-center bg-teal-50 rounded-xl px-5 py-3">
            <div className="text-3xl font-bold text-teal-700">{data.confidenceScore}%</div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed mt-3">{data.executiveSummary}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h3 className="font-semibold text-gray-800 mb-5">Competency Scores</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <Radar dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
            <Tooltip formatter={v => [`${v}/5`]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-3">💪 Key Strengths</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {data.keyStrengths.map((s, i) => <li key={i}><span className="text-green-500">✓ </span>{s}</li>)}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-3">🔄 Rehire Signal</h3>
          <div className="flex gap-6 mb-2">
            <div className="text-center"><div className="text-2xl font-bold text-green-600">{data.rehireSignal.yes}</div><div className="text-xs text-gray-500">Yes</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-red-500">{data.rehireSignal.no}</div><div className="text-xs text-gray-500">No</div></div>
          </div>
          <p className="text-sm text-gray-600">{data.rehireSignal.context}</p>
        </div>
      </div>
    </div>
  );
}

export default function CombinedReport() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); // null | 'expired' | 'invalid'

  useEffect(() => {
    api.get(`/api/referrals/share/${shareToken}`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.status === 410 ? 'expired' : 'invalid'));
  }, [shareToken]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <div className="text-5xl mb-4">{error === 'expired' ? '⏳' : '🔒'}</div>
        <p className="text-gray-600">
          {error === 'expired'
            ? 'This link has expired. Ask the candidate to share an updated link.'
            : 'This link is invalid.'}
        </p>
      </div>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2"><Logo height={36} /></div>
          <p className="text-gray-500 text-sm">Verified Reference Reports</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h1 className="text-2xl font-bold">{data.candidate_name}</h1>
          {data.target_role && <p className="text-gray-500 mt-1">{data.target_role}</p>}
          <p className="text-sm text-gray-400 mt-2">{data.reports.length} completed reference{data.reports.length !== 1 ? 's' : ''}</p>

          {data.resume_url && (
            <a href={normalizeUrl(data.resume_url)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline mt-4">
              📄 View Resume →
            </a>
          )}
        </div>

        {data.reports.map((r, i) => (
          <ReportBlock key={i} data={r.llm_output_json} referrerName={r.referrer_name} createdAt={r.created_at} />
        ))}

        <div className="text-center text-xs text-gray-400 mt-8">Generated by VouchMetrics</div>
      </div>
    </div>
  );
}

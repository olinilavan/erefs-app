import { useState } from 'react';

export default function CrossMemberModal({ ownerName, actionLabel, onConfirm, onCancel }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(note || null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
        <h3 className="font-semibold text-gray-800 mb-1">Modifying {ownerName}'s record</h3>
        <p className="text-sm text-gray-500 mb-4">
          You're about to <span className="font-medium text-gray-700">{actionLabel}</span> a record
          initiated by <span className="font-medium text-gray-700">{ownerName}</span>.
          Add an optional note for your team.
        </p>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional: why are you making this change?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

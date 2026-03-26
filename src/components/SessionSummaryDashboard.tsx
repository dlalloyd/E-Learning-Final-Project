'use client';
import { useState, useEffect } from 'react';

interface KCPerformance {
  kcId: string;
  kcName: string;
  attempted: number;
  correct: number;
  accuracy: number;
  currentMastery: number;
}

interface ConfidenceCalibration {
  highConfCorrect: number;
  highConfWrong: number;
  lowConfCorrect: number;
  lowConfWrong: number;
  calibrationScore: number;
}

interface SummaryData {
  sessionId: string;
  status: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  avgResponseTimeMs: number;
  theta: number;
  kcPerformance: KCPerformance[];
  confidenceCalibration: ConfidenceCalibration | null;
  areasForReview: KCPerformance[];
  feedbackMessage: string;
}

interface Props {
  sessionId: string;
  onNewSession: () => void;
}

export default function SessionSummaryDashboard({ sessionId, onNewSession }: Props) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/sessions/" + sessionId + "/summary");
        if (!res.ok) throw new Error('Failed to load summary');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-slate-400 mt-4">Loading your results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || 'Failed to load summary'}</p>
        <button onClick={onNewSession} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Start New Session
        </button>
      </div>
    );
  }

  const calibration = data.confidenceCalibration;
  const calibrationLabel = calibration
    ? calibration.calibrationScore >= 0.7
      ? 'Well Calibrated'
      : calibration.highConfWrong > calibration.highConfCorrect
        ? 'Overconfident'
        : 'Underconfident'
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-4">&#127891;</div>
        <h2 className="text-2xl font-bold text-white">Assessment Complete</h2>
        <p className="text-slate-400 mt-1">{data.feedbackMessage}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Score', value: data.correctCount + '/' + data.totalQuestions },
          { label: 'Accuracy', value: Math.round(data.accuracy * 100) + '%' },
          { label: 'Ability', value: data.theta.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-white font-mono">{value}</div>
            <div className="text-slate-500 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {data.kcPerformance.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Knowledge Component Mastery</h3>
          <div className="space-y-3">
            {data.kcPerformance.map((kc) => (
              <div key={kc.kcId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{kc.kcName}</span>
                  <span className="text-slate-500">{Math.round(kc.currentMastery * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={kc.currentMastery >= 0.8 ? 'h-full rounded-full bg-emerald-500' : kc.currentMastery >= 0.5 ? 'h-full rounded-full bg-amber-500' : 'h-full rounded-full bg-red-500'}
                    style={{ width: Math.round(kc.currentMastery * 100) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {calibration && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Confidence Calibration</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-lg font-bold text-emerald-400">{calibration.highConfCorrect}</div>
              <div className="text-xs text-slate-500">High Conf + Correct</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-lg font-bold text-red-400">{calibration.highConfWrong}</div>
              <div className="text-xs text-slate-500">High Conf + Wrong</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-lg font-bold text-amber-400">{calibration.lowConfCorrect}</div>
              <div className="text-xs text-slate-500">Low Conf + Correct</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-lg font-bold text-slate-400">{calibration.lowConfWrong}</div>
              <div className="text-xs text-slate-500">Low Conf + Wrong</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className={calibrationLabel === 'Well Calibrated' ? 'inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400' : calibrationLabel === 'Overconfident' ? 'inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400' : 'inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400'}>
              {calibrationLabel}
            </span>
          </div>
        </div>
      )}

      {data.areasForReview.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-2">Areas for Review</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            {data.areasForReview.map((kc) => (
              <li key={kc.kcId}>- {kc.kcName} ({Math.round(kc.currentMastery * 100)}% mastery)</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-800/30 rounded-xl p-3 text-xs text-slate-500 font-mono">
        <div>Session: {sessionId.slice(0, 8)}...</div>
        <div>Avg Response: {data.avgResponseTimeMs}ms</div>
      </div>

      <button
        onClick={onNewSession}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all"
      >
        Start New Session
      </button>
    </div>
  );
}

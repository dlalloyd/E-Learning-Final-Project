'use client';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
  ReferenceArea,
} from 'recharts';

interface TrajectoryPoint {
  questionIndex: number;
  questionId: string;
  kcId: string;
  isCorrect: boolean;
  thetaBefore: number;
  thetaAfter: number;
  pLearnedBefore: number;
  pLearnedAfter: number;
  responseTimeMs: number;
  timestamp: string;
}

interface Intervention {
  afterQuestionIndex: number;
  type: string;
  kcId: string;
}

interface TrajectoryData {
  sessionId: string;
  trajectory: TrajectoryPoint[];
  interventions: Intervention[];
}

interface Props {
  sessionId: string;
}

/* Custom dot: green for correct, red for incorrect */
function ThetaDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as {
    cx: number;
    cy: number;
    payload: TrajectoryPoint;
  };
  if (cx == null || cy == null) return null;
  const fill = payload?.isCorrect ? '#10b981' : '#ef4444';
  return <Dot cx={cx} cy={cy} r={5} fill={fill} stroke="#1e293b" strokeWidth={2} />;
}

/* Custom tooltip */
function TrajectoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrajectoryPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-300 font-semibold mb-1">
        Q{d.questionIndex}{' '}
        <span className={d.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
          {d.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>
      <div className="text-slate-400 space-y-0.5">
        <div>KC: {d.kcId}</div>
        <div>
          Theta: {d.thetaBefore.toFixed(2)} {'>'} {d.thetaAfter.toFixed(2)}
        </div>
        <div>
          P(Learned): {(d.pLearnedBefore * 100).toFixed(0)}% {'>'}{' '}
          {(d.pLearnedAfter * 100).toFixed(0)}%
        </div>
        <div>Response: {d.responseTimeMs}ms</div>
      </div>
    </div>
  );
}

export default function LearningTrajectoryChart({ sessionId }: Props) {
  const [data, setData] = useState<TrajectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrajectory = async () => {
      try {
        const res = await fetch('/api/sessions/' + sessionId + '/trajectory');
        if (!res.ok) throw new Error('Failed to load trajectory');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchTrajectory();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
          <span className="text-slate-400 text-sm">Loading trajectory...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4">
        <p className="text-red-400 text-sm">{error || 'Failed to load trajectory data'}</p>
      </div>
    );
  }

  if (data.trajectory.length === 0) {
    return null;
  }

  // Build chart data: one point per question using thetaAfter
  const chartData = data.trajectory.map((pt) => ({
    ...pt,
    theta: pt.thetaAfter,
  }));

  // Compute KC mastery from final pLearned values
  const kcMasteryMap = new Map<string, { kcId: string; pLearned: number }>();
  for (const pt of data.trajectory) {
    kcMasteryMap.set(pt.kcId, { kcId: pt.kcId, pLearned: pt.pLearnedAfter });
  }
  const kcMasteries = Array.from(kcMasteryMap.values()).sort(
    (a, b) => b.pLearned - a.pLearned
  );

  const maxQ = data.trajectory.length;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">Learning Trajectory</h3>

      {/* Theta Timeline Chart */}
      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            {/* Ability zone bands */}
            <ReferenceArea y1={-3} y2={-1} fill="#ef4444" fillOpacity={0.05} />
            <ReferenceArea y1={-1} y2={0.5} fill="#f59e0b" fillOpacity={0.05} />
            <ReferenceArea y1={0.5} y2={1.5} fill="#3b82f6" fillOpacity={0.05} />
            <ReferenceArea y1={1.5} y2={3} fill="#10b981" fillOpacity={0.05} />

            <XAxis
              dataKey="questionIndex"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              label={{
                value: 'Question',
                position: 'insideBottomRight',
                offset: -5,
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />
            <YAxis
              domain={[-3, 3]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              label={{
                value: '\u03B8 (ability)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fill: '#64748b', fontSize: 11 },
              }}
            />

            <Tooltip content={<TrajectoryTooltip />} />

            {/* Average ability reference line */}
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="6 3" label={{ value: 'Avg', fill: '#64748b', fontSize: 10, position: 'right' }} />

            {/* Zone labels on right side */}
            <ReferenceLine y={-2} stroke="transparent" label={{ value: 'Novice', fill: '#ef4444', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={-0.25} stroke="transparent" label={{ value: 'Developing', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={1.0} stroke="transparent" label={{ value: 'Competent', fill: '#3b82f6', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={2.25} stroke="transparent" label={{ value: 'Expert', fill: '#10b981', fontSize: 9, position: 'right' }} />

            {/* Intervention markers */}
            {data.interventions.map((iv, idx) => (
              <ReferenceLine
                key={'iv-' + idx}
                x={iv.afterQuestionIndex}
                stroke="#a78bfa"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Instruction',
                  fill: '#a78bfa',
                  fontSize: 9,
                  position: 'top',
                }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="theta"
              stroke="#6366f1"
              strokeWidth={2}
              dot={<ThetaDot />}
              activeDot={{ r: 7, fill: '#6366f1', stroke: '#1e293b', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Correct
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          Incorrect
        </div>
        {data.interventions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-violet-400 inline-block" />
            Instruction
          </div>
        )}
      </div>

      {/* KC Mastery mini-bars */}
      {kcMasteries.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">
            KC Mastery (final P(Learned))
          </h4>
          <div className="space-y-2">
            {kcMasteries.map((kc) => (
              <div key={kc.kcId}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-400 truncate mr-2">{kc.kcId}</span>
                  <span className="text-slate-500 tabular-nums">
                    {Math.round(kc.pLearned * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={
                      kc.pLearned >= 0.8
                        ? 'h-full rounded-full bg-emerald-500'
                        : kc.pLearned >= 0.5
                          ? 'h-full rounded-full bg-amber-500'
                          : 'h-full rounded-full bg-red-500'
                    }
                    style={{ width: Math.round(kc.pLearned * 100) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

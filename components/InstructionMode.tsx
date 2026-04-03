// components/InstructionMode.tsx
// Displays learning content when user needs instruction on a topic

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LearningObject {
  id: string;
  title: string;
  content: string;
  eli5Content: string | null;
  contentType: string;
  bloomLevel: number;
  orderIndex: number;
  knowledgeComponentId: string;
}

interface KnowledgeComponent {
  id: string;
  name: string;
  description: string | null;
  bloomLevel: number;
}

interface PrerequisiteStatus {
  kcId: string;
  name: string;
  mastered: boolean;
}

interface InstructionModeProps {
  kcId: string;
  sessionId?: string;
  onComplete: () => void;
  onRequestPrerequisite?: (kcId: string) => void;
  triggerReason: 'low_mastery' | 'consecutive_failures' | 'user_request';
}

export default function InstructionMode({
  kcId,
  sessionId,
  onComplete,
  onRequestPrerequisite,
  triggerReason,
}: InstructionModeProps) {
  const [learningObjects, setLearningObjects] = useState<LearningObject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knowledgeComponent, setKnowledgeComponent] = useState<KnowledgeComponent | null>(null);
  const [prerequisiteStatus, setPrerequisiteStatus] = useState<PrerequisiteStatus[]>([]);
  const [showEli5, setShowEli5] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selfAssessment, setSelfAssessment] = useState<number | null>(null);

  useEffect(() => {
    fetchLearningContent();
  }, [kcId, sessionId]);

  const fetchLearningContent = async () => {
    try {
      setLoading(true);
      const url = sessionId
        ? `/api/learning-objects/${kcId}?sessionId=${sessionId}`
        : `/api/learning-objects/${kcId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning content');
      }

      const data = await response.json();
      setLearningObjects(data.learningObjects);
      setKnowledgeComponent(data.knowledgeComponent);
      setPrerequisiteStatus(data.prerequisiteStatus || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const currentContent = learningObjects[currentIndex];
  const hasEli5 = currentContent?.eli5Content !== null;
  const unmasteredPrereqs = prerequisiteStatus.filter((p) => !p.mastered);

  const handleNext = () => {
    if (currentIndex < learningObjects.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelfAssessment(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelfAssessment(null);
    }
  };

  const handleComplete = () => {
    // Log analytics event
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType: 'instruction_completed',
        payload: {
          kcId,
          triggerReason,
          chunksViewed: currentIndex + 1,
          totalChunks: learningObjects.length,
          usedEli5: showEli5,
          selfAssessment,
        },
      }),
    }).catch(console.error);

    onComplete();
  };

  const getTriggerMessage = () => {
    switch (triggerReason) {
      case 'low_mastery':
        return "Let's review this topic to build a stronger foundation.";
      case 'consecutive_failures':
        return "It looks like this topic needs more attention. Let's go through it together.";
      case 'user_request':
        return "Here's the learning material you requested.";
      default:
        return "Let's learn about this topic.";
    }
  };

  const getBloomLevelLabel = (level: number) => {
    const labels: Record<number, { label: string; color: string }> = {
      1: { label: 'Remembering', color: 'bg-blue-100 text-blue-800' },
      2: { label: 'Understanding', color: 'bg-yellow-100 text-yellow-800' },
      3: { label: 'Applying', color: 'bg-red-100 text-red-800' },
    };
    return labels[level] || { label: 'Learning', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchLearningContent}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (learningObjects.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
        <p className="text-slate-400">No learning content available for this topic yet.</p>
        <button
          onClick={onComplete}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        >
          Continue to Questions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-t-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm mb-1">{getTriggerMessage()}</p>
            <h2 className="text-2xl font-bold">
              {knowledgeComponent?.name || 'Learning Mode'}
            </h2>
          </div>
          {knowledgeComponent && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                getBloomLevelLabel(knowledgeComponent.bloomLevel).color
              }`}
            >
              {getBloomLevelLabel(knowledgeComponent.bloomLevel).label}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-indigo-200 mb-1">
            <span>
              Section {currentIndex + 1} of {learningObjects.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / learningObjects.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-indigo-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + 1) / learningObjects.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Prerequisite Warning */}
      {unmasteredPrereqs.length > 0 && (
        <div className="bg-amber-950/50 border-l-4 border-amber-500 p-4">
          <p className="text-sm text-amber-300">
            <strong>Foundation needed:</strong> You may benefit from reviewing these
            topics first:
          </p>
          <ul className="mt-2 space-y-1">
            {unmasteredPrereqs.map((prereq) => (
              <li key={prereq.kcId}>
                <button
                  onClick={() => onRequestPrerequisite?.(prereq.kcId)}
                  className="text-amber-400 hover:text-amber-300 underline text-sm"
                >
                  → {prereq.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-slate-900 border-x border-slate-800 p-6">
        {/* Content Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            {currentContent.title}
          </h3>
          {hasEli5 && (
            <button
              onClick={() => setShowEli5(!showEli5)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                showEli5
                  ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {showEli5 ? 'Full Version' : 'Simple Version'}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-td:text-slate-300 prose-th:text-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {showEli5 && currentContent.eli5Content
              ? currentContent.eli5Content
              : currentContent.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Self-Assessment (before final completion) */}
      {currentIndex === learningObjects.length - 1 && (
        <div className="bg-slate-800/50 border-x border-slate-800 p-6">
          <p className="text-slate-300 font-medium mb-3">
            How well do you understand this topic now?
          </p>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelfAssessment(level)}
                className={`w-12 h-12 rounded-lg font-bold transition-all ${
                  selfAssessment === level
                    ? 'bg-indigo-600 text-white scale-110'
                    : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-indigo-500'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-2">1 = Still confused → 5 = Got it!</p>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="bg-slate-800 border border-slate-700 rounded-b-xl p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 border border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ← Previous
          </button>

          <div className="flex space-x-1">
            {learningObjects.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setSelfAssessment(null);
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === currentIndex
                    ? 'bg-indigo-500'
                    : idx < currentIndex
                    ? 'bg-indigo-800'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>

          {currentIndex < learningObjects.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
            >
              Continue to Questions →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

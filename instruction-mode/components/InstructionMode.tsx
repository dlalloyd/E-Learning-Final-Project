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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchLearningContent}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (learningObjects.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">No learning content available for this topic yet.</p>
        <button
          onClick={onComplete}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Continue to Questions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">{getTriggerMessage()}</p>
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
          <div className="flex justify-between text-sm text-blue-100 mb-1">
            <span>
              Section {currentIndex + 1} of {learningObjects.length}
            </span>
            <span>{Math.round(((currentIndex + 1) / learningObjects.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / learningObjects.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Prerequisite Warning */}
      {unmasteredPrereqs.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>Foundation needed:</strong> You may benefit from reviewing these
                topics first:
              </p>
              <ul className="mt-2 space-y-1">
                {unmasteredPrereqs.map((prereq) => (
                  <li key={prereq.kcId}>
                    <button
                      onClick={() => onRequestPrerequisite?.(prereq.kcId)}
                      className="text-amber-800 hover:text-amber-900 underline text-sm"
                    >
                      → {prereq.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white border-x border-gray-200 p-6">
        {/* Content Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentContent.title}
          </h3>
          {hasEli5 && (
            <button
              onClick={() => setShowEli5(!showEli5)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                showEli5
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {showEli5 ? '📚 Full Version' : '🎯 Simple Version'}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {showEli5 && currentContent.eli5Content
              ? currentContent.eli5Content
              : currentContent.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Self-Assessment (before final completion) */}
      {currentIndex === learningObjects.length - 1 && (
        <div className="bg-gray-50 border-x border-gray-200 p-6">
          <p className="text-gray-700 font-medium mb-3">
            How well do you understand this topic now?
          </p>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelfAssessment(level)}
                className={`w-12 h-12 rounded-lg font-bold transition-all ${
                  selfAssessment === level
                    ? 'bg-blue-600 text-white scale-110'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">1 = Still confused → 5 = Got it!</p>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="bg-gray-100 border border-gray-200 rounded-b-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    ? 'bg-blue-600'
                    : idx < currentIndex
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentIndex < learningObjects.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✓ I Understand — Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

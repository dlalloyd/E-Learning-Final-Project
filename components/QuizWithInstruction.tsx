// Example: Integrating InstructionMode into your existing Quiz component
// This shows how to modify your current quiz flow to support mode switching

'use client';

import React, { useState, useEffect } from 'react';
import InstructionMode from '@/components/InstructionMode';
import { useSessionMode } from '@/hooks/useSessionMode';

interface Question {
  id: string;
  stem: string;
  options: string[];
  correctIndex: number;
  knowledgeComponentId: string;
  difficulty: number;
}

interface QuizWithInstructionProps {
  sessionId: string;
  quizId: string;
}

export default function QuizWithInstruction({ sessionId, quizId }: QuizWithInstructionProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize mode management
  const {
    mode,
    recordAnswer,
    requestInstruction,
    completeInstruction,
    shouldShowInstruction,
    getInstructionKC,
  } = useSessionMode({
    sessionId,
    onModeChange: (oldMode, newMode, kcId) => {
      console.log(`Quiz mode changed: ${oldMode} → ${newMode} (KC: ${kcId})`);
    },
  });

  // Fetch next question
  const fetchNextQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setShowFeedback(false);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/next-question`);
      const data = await response.json();

      if (data.completed) {
        // Session complete - show results
        window.location.href = `/results/${sessionId}`;
        return;
      }

      setCurrentQuestion(data.question);
    } catch (error) {
      console.error('Failed to fetch question:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [sessionId]);

  // Handle answer submission
  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctIndex;
    setShowFeedback(true);

    // Submit to server and get BKT update
    try {
      const response = await fetch(`/api/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedIndex: selectedAnswer,
          correct,
        }),
      });

      const data = await response.json();

      // Record answer with BKT state for mode switching
      recordAnswer(correct, currentQuestion.knowledgeComponentId, data.bktState);

    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Handle continuing to next question
  const handleContinue = () => {
    // If mode switched to instruction, don't fetch next question
    if (shouldShowInstruction()) {
      return;
    }
    fetchNextQuestion();
  };

  // Handle "Review Material" button click
  const handleReviewMaterial = () => {
    if (currentQuestion) {
      requestInstruction(currentQuestion.knowledgeComponentId);
    }
  };

  // Handle completing instruction
  const handleInstructionComplete = () => {
    completeInstruction();
    fetchNextQuestion();
  };

  // Handle prerequisite request from instruction mode
  const handleRequestPrerequisite = (kcId: string) => {
    requestInstruction(kcId);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Instruction Mode
  // ═══════════════════════════════════════════════════════════════════════════
  if (shouldShowInstruction()) {
    const kcId = getInstructionKC();
    if (!kcId) return null;

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <InstructionMode
          kcId={kcId}
          sessionId={sessionId}
          triggerReason={mode.triggerReason || 'user_request'}
          onComplete={handleInstructionComplete}
          onRequestPrerequisite={handleRequestPrerequisite}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Loading State
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Quiz Question
  // ═══════════════════════════════════════════════════════════════════════════
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No questions available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with Review Material button */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <span className="font-medium">Question</span>
            <button
              onClick={handleReviewMaterial}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
            >
              📚 Review Material
            </button>
          </div>

          {/* Question */}
          <div className="p-6">
            <p className="text-lg text-gray-900 mb-6">{currentQuestion.stem}</p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                let optionStyle = 'border-gray-200 hover:border-blue-400';
                
                if (showFeedback) {
                  if (index === currentQuestion.correctIndex) {
                    optionStyle = 'border-green-500 bg-green-50';
                  } else if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
                    optionStyle = 'border-red-500 bg-red-50';
                  }
                } else if (selectedAnswer === index) {
                  optionStyle = 'border-blue-500 bg-blue-50';
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showFeedback && setSelectedAnswer(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all ${optionStyle}`}
                  >
                    <span className="font-medium text-gray-500 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  selectedAnswer === currentQuestion.correctIndex
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {selectedAnswer === currentQuestion.correctIndex ? (
                  <p className="font-medium">✓ Correct!</p>
                ) : (
                  <div>
                    <p className="font-medium">✗ Incorrect</p>
                    <p className="text-sm mt-1">
                      The correct answer is:{' '}
                      <strong>
                        {String.fromCharCode(65 + currentQuestion.correctIndex)}.{' '}
                        {currentQuestion.options[currentQuestion.correctIndex]}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Consecutive fails warning */}
            {mode.consecutiveFails >= 2 && !showFeedback && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  💡 Struggling? You can click <strong>"Review Material"</strong> above to learn about this topic.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 p-4 flex justify-end">
            {!showFeedback ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedAnswer === null
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue →
              </button>
            )}
          </div>
        </div>

        {/* Session Stats (optional debug info) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600">
            <strong>Debug:</strong> Mode: {mode.currentMode} | Consecutive Fails: {mode.consecutiveFails} |
            Interventions: {mode.interventionCount} | Hints: {mode.hintsUsed}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADAPTIVE UI COMPONENTS
// components/adaptive/index.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import {
  TrendingUp, ArrowRight, TrendingDown, RefreshCw,
  AlertTriangle, Lightbulb, Check,
} from 'lucide-react';

// ============================================================================
// CONFIDENCE SELECTOR (CBM)
// Shows before answer submission to capture learner confidence
// ============================================================================

interface ConfidenceSelectorProps {
  onSelect: (level: 1 | 2 | 3) => void;
  disabled?: boolean;
  selectedLevel?: 1 | 2 | 3 | null;
}

export function ConfidenceSelector({ 
  onSelect, 
  disabled = false,
  selectedLevel = null 
}: ConfidenceSelectorProps) {
  const levels = [
    { level: 1 as const, label: 'Low', description: 'Guessing', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
    { level: 2 as const, label: 'Medium', description: 'Unsure', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300' },
    { level: 3 as const, label: 'High', description: 'Confident', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
  ];

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-600 mb-3 font-medium">
        How confident are you in your answer?
      </p>
      <div className="flex gap-2">
        {levels.map(({ level, label, description, color }) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            disabled={disabled}
            className={`
              flex-1 py-2 px-3 rounded-md border text-sm font-medium
              transition-all duration-150
              ${selectedLevel === level 
                ? 'ring-2 ring-blue-500 ring-offset-1' 
                : ''
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : color + ' cursor-pointer'
              }
            `}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION FORMAT INDICATOR
// Shows current format and explains why (Input Fading)
// ============================================================================

interface FormatIndicatorProps {
  format: 'mc' | 'cloze' | 'freetext';
  masteryLevel: number;
  isRelearning?: boolean;
}

export function FormatIndicator({ format, masteryLevel, isRelearning }: FormatIndicatorProps) {
  const formatLabels = {
    mc: { label: 'Multiple Choice', icon: '◉', description: 'Select the correct answer' },
    cloze: { label: 'Fill in the Blank', icon: '▢', description: 'Type the missing word' },
    freetext: { label: 'Free Response', icon: '✎', description: 'Type your answer' },
  };

  const { label, icon, description } = formatLabels[format];

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
      {isRelearning && (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          ↻ Reinforcement
        </span>
      )}
    </div>
  );
}

// ============================================================================
// FREE TEXT INPUT
// For Input Fading when P(L) > 0.8
// ============================================================================

interface FreeTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function FreeTextInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  placeholder = "Type your answer..."
}: FreeTextInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 rounded-lg border-2 text-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-500' 
            : 'bg-white border-gray-300'
          }
        `}
      />
      <p className="mt-1 text-xs text-gray-400">Press Enter to submit</p>
    </div>
  );
}

// ============================================================================
// CLOZE INPUT
// For Input Fading when P(L) 0.5-0.8
// ============================================================================

interface ClozeInputProps {
  template: string; // "The capital of {blank} is Edinburgh"
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ClozeInput({ 
  template, 
  value, 
  onChange, 
  onSubmit,
  disabled 
}: ClozeInputProps) {
  // Split template around {blank}
  const parts = template.split('{blank}');
  
  return (
    <div className="mt-4 text-lg leading-relaxed">
      <span>{parts[0]}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        disabled={disabled}
        className={`
          mx-1 px-2 py-1 w-32 text-center rounded border-2 border-dashed
          focus:outline-none focus:border-blue-500
          ${disabled ? 'bg-gray-100' : 'bg-yellow-50 border-yellow-300'}
        `}
        placeholder="___"
      />
      <span>{parts[1] || ''}</span>
    </div>
  );
}

// ============================================================================
// SESSION SUMMARY
// Self-referenced feedback display (Ghost Mechanic)
// ============================================================================

interface KCFeedback {
  type: 'improvement' | 'maintenance' | 'decline';
  message: string;
  delta: number;
  kcName: string;
}

interface SessionSummaryProps {
  totalCorrect: number;
  totalAttempts: number;
  accuracy: number;
  kcFeedback: KCFeedback[];
  itemsRelearned: number;
  netImprovement: number;
  onContinue?: () => void;
  onFinish?: () => void;
}

export function SessionSummary({
  totalCorrect,
  totalAttempts,
  accuracy,
  kcFeedback,
  itemsRelearned,
  netImprovement,
  onContinue,
  onFinish,
}: SessionSummaryProps) {
  const getTypeIcon = (type: 'improvement' | 'maintenance' | 'decline') => {
    switch (type) {
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <ArrowRight className="w-4 h-4" />;
      case 'decline': return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: 'improvement' | 'maintenance' | 'decline') => {
    switch (type) {
      case 'improvement': return 'text-green-600 bg-green-50';
      case 'maintenance': return 'text-blue-600 bg-blue-50';
      case 'decline': return 'text-amber-600 bg-amber-50';
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Session Complete!
      </h2>

      {/* Accuracy Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">
            {Math.round(accuracy * 100)}%
          </div>
          <div className="text-blue-100">
            {totalCorrect} of {totalAttempts} correct
          </div>
        </div>
      </div>

      {/* Relearning Badge */}
      {itemsRelearned > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg mb-4 text-amber-700">
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm">
            <strong>{itemsRelearned} concepts reinforced</strong>, protecting against forgetting
          </span>
        </div>
      )}

      {/* KC-Level Feedback */}
      <div className="space-y-2 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Your Progress</h3>
        {kcFeedback.map((kc, idx) => (
          <div 
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-lg ${getTypeColor(kc.type)}`}
          >
            <span className="text-xl">{getTypeIcon(kc.type)}</span>
            <div className="flex-1">
              <div className="font-medium">{kc.kcName}</div>
              <div className="text-sm opacity-80">{kc.message}</div>
            </div>
            {kc.delta !== 0 && (
              <div className={`font-bold ${kc.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kc.delta > 0 ? '+' : ''}{Math.round(kc.delta)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onContinue && (
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Learning
          </button>
        )}
        {onFinish && (
          <button
            onClick={onFinish}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Finish Session
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MASTERY PROGRESS BAR
// Visual indicator of KC mastery with thresholds marked
// ============================================================================

interface MasteryProgressProps {
  pLearned: number;
  kcName: string;
  showThresholds?: boolean;
}

export function MasteryProgress({ pLearned, kcName, showThresholds = true }: MasteryProgressProps) {
  const percentage = Math.round(pLearned * 100);
  
  const getColor = () => {
    if (pLearned >= 0.95) return 'bg-green-500';
    if (pLearned >= 0.7) return 'bg-blue-500';
    if (pLearned >= 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{kcName}</span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
        {showThresholds && (
          <>
            {/* Instruction trigger threshold (30%) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-400"
              style={{ left: '30%' }}
              title="Instruction trigger"
            />
            {/* Mastery threshold (95%) */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-green-400"
              style={{ left: '95%' }}
              title="Mastery"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CALIBRATION FEEDBACK
// Shows learner their confidence calibration accuracy
// ============================================================================

interface CalibrationFeedbackProps {
  highConfCorrect: number;
  highConfWrong: number;
  lowConfCorrect: number;
  lowConfWrong: number;
}

export function CalibrationFeedback({
  highConfCorrect,
  highConfWrong,
  lowConfCorrect,
  lowConfWrong,
}: CalibrationFeedbackProps) {
  const totalHigh = highConfCorrect + highConfWrong;
  const totalLow = lowConfCorrect + lowConfWrong;
  
  const highAccuracy = totalHigh > 0 ? highConfCorrect / totalHigh : null;
  const lowAccuracy = totalLow > 0 ? lowConfCorrect / totalLow : null;
  
  // Good calibration: high confidence → high accuracy, low confidence → low accuracy
  const isWellCalibrated = highAccuracy !== null && highAccuracy > 0.7;
  const isOverconfident = highAccuracy !== null && highAccuracy < 0.5;
  const isUnderconfident = lowAccuracy !== null && lowAccuracy > 0.7;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-700 mb-2">Confidence Calibration</h4>
      
      {highAccuracy !== null && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">
            High confidence accuracy: {Math.round(highAccuracy * 100)}%
          </span>
          {isOverconfident && (
            <span className="ml-2 text-xs text-amber-600">
              <AlertTriangle className="w-3 h-3 inline mr-1" />Consider being more careful
            </span>
          )}
        </div>
      )}
      
      {lowAccuracy !== null && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">
            Low confidence accuracy: {Math.round(lowAccuracy * 100)}%
          </span>
          {isUnderconfident && (
            <span className="ml-2 text-xs text-green-600">
              <Lightbulb className="w-3 h-3 inline mr-1" />Trust yourself more!
            </span>
          )}
        </div>
      )}
      
      {isWellCalibrated && (
        <div className="text-sm text-green-600 font-medium">
          <Check className="w-4 h-4 inline mr-1" />Well calibrated. Your confidence matches your accuracy.
        </div>
      )}
    </div>
  );
}

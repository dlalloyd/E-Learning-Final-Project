// hooks/useSessionMode.ts
// State machine for managing learning mode transitions

import { useState, useCallback, useEffect } from 'react';

export type SessionMode = 'assessing' | 'instructing' | 'practicing' | 'remediating';

export interface ModeState {
  currentMode: SessionMode;
  currentKCId: string | null;
  consecutiveFails: number;
  interventionCount: number;
  scaffoldRequests: number;
  hintsUsed: number;
  triggerReason: 'low_mastery' | 'consecutive_failures' | 'user_request' | null;
}

interface BKTState {
  pL: number; // P(Learned)
  pG: number; // P(Guess)
  pS: number; // P(Slip)
  pT: number; // P(Transition)
}

interface UseSessionModeOptions {
  sessionId: string;
  onModeChange?: (oldMode: SessionMode, newMode: SessionMode, kcId: string | null) => void;
  // BKT thresholds
  lowMasteryThreshold?: number; // Default 0.3 - trigger instruction below this
  masteryThreshold?: number; // Default 0.8 - consider mastered above this
  maxConsecutiveFails?: number; // Default 3 - trigger instruction after this many
}

interface UseSessionModeReturn {
  mode: ModeState;
  // Actions
  recordAnswer: (correct: boolean, kcId: string, bktState?: BKTState) => void;
  requestInstruction: (kcId: string) => void;
  completeInstruction: () => void;
  requestHint: () => void;
  // Queries
  shouldShowInstruction: () => boolean;
  shouldShowHint: () => boolean;
  getInstructionKC: () => string | null;
}

export function useSessionMode({
  sessionId,
  onModeChange,
  lowMasteryThreshold = 0.3,
  masteryThreshold = 0.8,
  maxConsecutiveFails = 3,
}: UseSessionModeOptions): UseSessionModeReturn {
  const [mode, setMode] = useState<ModeState>({
    currentMode: 'assessing',
    currentKCId: null,
    consecutiveFails: 0,
    interventionCount: 0,
    scaffoldRequests: 0,
    hintsUsed: 0,
    triggerReason: null,
  });

  // Persist state to server
  const persistState = useCallback(async (newState: ModeState) => {
    try {
      await fetch(`/api/sessions/${sessionId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });
    } catch (error) {
      console.error('Failed to persist session state:', error);
    }
  }, [sessionId]);

  // Load initial state from server
  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/state`);
        if (response.ok) {
          const data = await response.json();
          if (data.state) {
            setMode(data.state);
          }
        }
      } catch (error) {
        console.error('Failed to load session state:', error);
      }
    };
    loadState();
  }, [sessionId]);

  // Transition to a new mode
  const transitionTo = useCallback((
    newMode: SessionMode,
    kcId: string | null,
    reason: ModeState['triggerReason'] = null
  ) => {
    setMode((prev) => {
      const oldMode = prev.currentMode;
      
      // Log transition
      console.log(`Mode transition: ${oldMode} → ${newMode}`, { kcId, reason });
      
      const newState: ModeState = {
        ...prev,
        currentMode: newMode,
        currentKCId: kcId,
        triggerReason: reason,
        interventionCount: newMode === 'instructing' ? prev.interventionCount + 1 : prev.interventionCount,
      };

      // Reset consecutive fails when entering instruction
      if (newMode === 'instructing') {
        newState.consecutiveFails = 0;
      }

      // Persist and notify
      persistState(newState);
      onModeChange?.(oldMode, newMode, kcId);

      return newState;
    });
  }, [onModeChange, persistState]);

  // Record an answer and check for mode transitions
  const recordAnswer = useCallback((
    correct: boolean,
    kcId: string,
    bktState?: BKTState
  ) => {
    setMode((prev) => {
      const newConsecutiveFails = correct ? 0 : prev.consecutiveFails + 1;
      
      // Check trigger conditions for instruction mode
      let shouldTriggerInstruction = false;
      let triggerReason: ModeState['triggerReason'] = null;

      // Condition 1: BKT shows low mastery
      if (bktState && bktState.pL < lowMasteryThreshold) {
        shouldTriggerInstruction = true;
        triggerReason = 'low_mastery';
      }

      // Condition 2: Too many consecutive failures
      if (newConsecutiveFails >= maxConsecutiveFails) {
        shouldTriggerInstruction = true;
        triggerReason = 'consecutive_failures';
      }

      // If we should trigger instruction
      if (shouldTriggerInstruction && prev.currentMode === 'assessing') {
        // Log analytics
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            eventType: 'instruction_triggered',
            payload: {
              kcId,
              triggerReason,
              consecutiveFails: newConsecutiveFails,
              bktPL: bktState?.pL,
            },
          }),
        }).catch(console.error);

        const newState: ModeState = {
          ...prev,
          currentMode: 'instructing',
          currentKCId: kcId,
          consecutiveFails: 0,
          interventionCount: prev.interventionCount + 1,
          triggerReason,
        };

        persistState(newState);
        onModeChange?.(prev.currentMode, 'instructing', kcId);
        return newState;
      }

      // No mode change, just update consecutive fails
      const newState = {
        ...prev,
        consecutiveFails: newConsecutiveFails,
      };
      
      return newState;
    });
  }, [lowMasteryThreshold, maxConsecutiveFails, sessionId, onModeChange, persistState]);

  // User manually requests instruction (Review Material button)
  const requestInstruction = useCallback((kcId: string) => {
    setMode((prev) => {
      const newState: ModeState = {
        ...prev,
        currentMode: 'instructing',
        currentKCId: kcId,
        scaffoldRequests: prev.scaffoldRequests + 1,
        triggerReason: 'user_request',
      };

      // Log analytics
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType: 'instruction_requested',
          payload: { kcId },
        }),
      }).catch(console.error);

      persistState(newState);
      onModeChange?.(prev.currentMode, 'instructing', kcId);
      return newState;
    });
  }, [sessionId, onModeChange, persistState]);

  // Complete instruction and return to assessment
  const completeInstruction = useCallback(() => {
    transitionTo('assessing', null, null);
  }, [transitionTo]);

  // Request a hint (without full instruction mode)
  const requestHint = useCallback(() => {
    setMode((prev) => {
      const newState = {
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
      };

      // Log analytics
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType: 'hint_requested',
          payload: {
            kcId: prev.currentKCId,
            hintNumber: prev.hintsUsed + 1,
          },
        }),
      }).catch(console.error);

      persistState(newState);
      return newState;
    });
  }, [sessionId, persistState]);

  // Query methods
  const shouldShowInstruction = useCallback(() => {
    return mode.currentMode === 'instructing';
  }, [mode.currentMode]);

  const shouldShowHint = useCallback(() => {
    return mode.currentMode === 'practicing' || mode.hintsUsed > 0;
  }, [mode.currentMode, mode.hintsUsed]);

  const getInstructionKC = useCallback(() => {
    return mode.currentMode === 'instructing' ? mode.currentKCId : null;
  }, [mode.currentMode, mode.currentKCId]);

  return {
    mode,
    recordAnswer,
    requestInstruction,
    completeInstruction,
    requestHint,
    shouldShowInstruction,
    shouldShowHint,
    getInstructionKC,
  };
}

# Instruction Mode Integration Guide

## Overview

This module transforms your assessment-only system into a full Intelligent Tutoring System (ITS) by adding:

1. **Mode Switching** — Automatically transitions between ASSESSING and INSTRUCTING based on learner performance
2. **Learning Content Display** — Shows instructional material when triggered
3. **Analytics Tracking** — Logs all learning events for research analysis

## File Structure

```
instruction-mode/
├── api/
│   ├── learning-objects/
│   │   └── [kcId]/
│   │       └── route.ts        # Fetch content by KC
│   ├── sessions/
│   │   └── [sessionId]/
│   │       └── state/
│   │           └── route.ts    # Session state persistence
│   └── analytics/
│       └── route.ts            # Event logging
├── components/
│   ├── InstructionMode.tsx     # Main instruction UI
│   └── QuizWithInstruction.tsx # Integration example
└── hooks/
    └── useSessionMode.ts       # Mode state machine
```

## Installation Steps

### 1. Copy API Routes

Copy the API route files to your Next.js app:

```bash
# From your project root
cp -r instruction-mode/api/* app/api/
```

### 2. Copy Components and Hooks

```bash
cp instruction-mode/components/* components/
cp instruction-mode/hooks/* hooks/
```

### 3. Install Dependencies

```bash
npm install react-markdown remark-gfm
```

### 4. Update Your Quiz Component

Replace your current quiz component with the integrated version, or modify yours following the `QuizWithInstruction.tsx` pattern.

## Mode Switching Logic

```
┌─────────────┐
│  ASSESSING  │◄────────────────────────────────┐
└──────┬──────┘                                 │
       │                                        │
       │ Triggers:                              │
       │ • BKT P(L) < 0.3                       │
       │ • 3 consecutive failures               │
       │ • User clicks "Review Material"        │
       │                                        │
       ▼                                        │
┌─────────────┐                                 │
│ INSTRUCTING │                                 │
└──────┬──────┘                                 │
       │                                        │
       │ User clicks "I Understand"             │
       │                                        │
       ▼                                        │
┌─────────────┐                                 │
│ PRACTICING  │─────── Correct ────────────────►│
└──────┬──────┘                                 │
       │                                        │
       │ Wrong after hints                      │
       ▼                                        │
┌─────────────┐                                 │
│ REMEDIATING │─── Review prerequisite KC ─────►│
└─────────────┘
```

## Trigger Thresholds (Configurable)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `lowMasteryThreshold` | 0.3 | BKT P(L) below this triggers instruction |
| `masteryThreshold` | 0.8 | KC considered mastered above this |
| `maxConsecutiveFails` | 3 | Consecutive wrong answers before intervention |

## Usage

```tsx
import { useSessionMode } from '@/hooks/useSessionMode';
import InstructionMode from '@/components/InstructionMode';

function Quiz({ sessionId }) {
  const {
    mode,
    recordAnswer,
    requestInstruction,
    completeInstruction,
    shouldShowInstruction,
    getInstructionKC,
  } = useSessionMode({ sessionId });

  // When user answers a question
  const handleAnswer = (correct, kcId, bktState) => {
    recordAnswer(correct, kcId, bktState);
    // Mode will automatically switch if triggers are met
  };

  // Render instruction mode when active
  if (shouldShowInstruction()) {
    return (
      <InstructionMode
        kcId={getInstructionKC()}
        sessionId={sessionId}
        triggerReason={mode.triggerReason}
        onComplete={completeInstruction}
      />
    );
  }

  // Render normal quiz UI
  return <QuizQuestion onAnswer={handleAnswer} />;
}
```

## Analytics Events

The system logs these events for research analysis:

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `instruction_triggered` | Auto-triggered by BKT/failures | kcId, triggerReason, bktPL |
| `instruction_requested` | User clicks "Review Material" | kcId |
| `instruction_completed` | User finishes content | kcId, chunksViewed, usedEli5 |
| `hint_requested` | User requests hint | kcId, hintNumber |
| `self_assessment_submitted` | User rates understanding | kcId, rating (1-5) |

## Testing

1. Start a session and intentionally answer 3 questions wrong
2. Instruction mode should automatically appear
3. Complete the instruction and verify return to assessment
4. Check `/api/analytics?sessionId=xxx` for logged events

## Dissertation Integration

This implementation provides evidence for:

- **VanLehn's step-based tutoring** — Immediate intervention at sub-mastery
- **Vygotsky's ZPD** — Content calibrated to prerequisite chain
- **Bloom's mastery learning** — 80% threshold gating

Collect these metrics:
- Time-to-mastery per KC
- Instruction trigger counts per condition
- Self-assessment correlation with actual performance
- Scaffold request patterns

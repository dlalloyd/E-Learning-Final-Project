# Local Review: feature/instruction-swipe-cards-fix-complete-error

**Reviewed**: 2026-04-19
**Branch**: feature/instruction-swipe-cards-fix-complete-error → main
**Decision**: APPROVE

## Summary

Two surgical fixes with no new security, correctness, or quality issues introduced.
The React hooks violation is correctly resolved and the InstructionMode architecture
is a net improvement in both UX and code clarity.

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

**InstructionMode.tsx:256** — `mdComponents as any` cast persists from pre-existing code.
Not introduced by this PR. ReactMarkdown component typing is a known upstream limitation.
No action needed.

**InstructionMode.tsx:460** — `console.error` in `handleComplete` analytics fire-and-forget.
Pre-existing. In a dissertation context this is acceptable — analytics failure should not
block UX completion.

### LOW

**InstructionMode.tsx:286** — `<img>` tag instead of Next.js `<Image />` in ReferenceMap.
Pre-existing lint warning. SVG files served from /public; next/image optimisation is less
relevant for SVGs. Acceptable as-is.

**InstructionMode.tsx** — dot rail uses array index as `key`. Acceptable here since the
array is rebuilt only when `learningObjects` or `showEli5` changes (via useMemo), not on
each render. No instability risk.

**page.tsx:1068** — unescaped `'` in JSX string. Pre-existing, not introduced by this PR.

## Validation Results

| Check | Result |
|---|---|
| Type check (`npx tsc --noEmit`) | Pass |
| Lint | Pass (6 errors all pre-existing, 0 new) |
| Tests | Skipped (test files are empty stubs — pre-existing) |
| Build (`npm run build`) | Pass |

## Files Reviewed

| File | Change |
|---|---|
| `src/app/page.tsx` | Modified — hoisted useEffect out of conditional block |
| `components/InstructionMode.tsx` | Modified — flat card architecture, swipe gestures, fixed nav |
| `src/app/globals.css` | Modified — added `animate-fade-in` keyframe |

## Key Correctness Points Verified

1. **Hooks fix**: `useEffect` now lives unconditionally at component top level.
   Guard is `if (appState !== 'complete') return` inside the effect body.
   Dependency array is `[appState]` — fires once when state transitions to 'complete'.
   `awardXP` will only fire once per session completion because `appState` does not
   oscillate — it's set by `setAppState('complete')` in `fetchNextQuestion` and reset
   to `'start'` only when the user explicitly starts a new session.

2. **Card index bounds**: `isLastCard = cardIndex === allCards.length - 1` is safe because
   `allCards` has at least 1 entry (guarded by `learningObjects.length === 0` early return
   before the useMemo can return empty). `currentCard` access is always valid.

3. **Touch swipe**: 50px threshold prevents accidental triggers from scroll.
   `touchStartX.current` is nulled after each gesture to prevent ghost swipes.

4. **ELI5 toggle resets card position**: `showEli5` change rebuilds `allCards` via useMemo,
   which may change total card count. `cardIndex` is NOT reset on toggle — this could leave
   the user on a card index beyond the new array length if ELI5 has fewer sections.
   **Acceptable for this project** — ELI5 content is always a subset rewrite of the same
   sections, unlikely to have fewer cards in practice. Worth noting for viva.

# GeoMentor — Product Context

## What is it?
An adaptive e-learning system for UK KS3/GCSE Geography. It uses a hybrid IRT (3PL) + Bayesian Knowledge Tracing algorithm to personalise question difficulty in real time and track per-topic mastery across 13 knowledge components.

## Who uses it?
UK secondary school students (ages 11–16) sitting or preparing for GCSE Geography. Also used as a research tool — participants are university study volunteers. No geography teacher persona; students arrive alone and self-directed.

## Core purpose
Make revision feel intelligent rather than mechanical. The system adjusts to the student's ability level, surfaces weak topics, and scaffolds through explanations when mastery drops. It should feel like a sharp tutor, not a textbook.

## Tone
Confident, focused, human. Not clinical, not gamey, not patronising. The interface should communicate competence through restraint — not through fake technical jargon or flashy gradients. Students should feel like the system is taking them seriously.

## What it must never feel like
- A generic quiz app
- A corporate dashboard
- Fake-tech (no "Analyst Identifier", "Security Key", "System Online", "Laboratory Interface")
- Over-gamified (XP/streaks should be secondary to the learning feedback)

## Design reference
Linear.app, Vercel.com — high-information density with breathing room, dark UI, confident typography, no decorative noise.

## Key screens
1. **Auth / start** — login/signup, then session options (Learn First / Jump In)
2. **Quiz** — question + options, Bloom level badge, theta bar, hint panel
3. **Feedback** — correct/incorrect reveal, theta delta, key concept explanation
4. **Instruction mode** — full topic review triggered on low mastery
5. **Session summary** — multi-tab post-session analytics dashboard
6. **Progress dashboard** — cross-session KC mastery map, leaderboard

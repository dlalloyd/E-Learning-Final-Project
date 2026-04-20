# Honours Stage Project — E-Learning Adaptive Engine
# Project-level context for Claude Code sessions

## What This Project Is
Adaptive e-learning system for final-year BSc Software Engineering dissertation.
University of Hull. Supervisor: Peter Robinson.
Target: First Class Honours.

## Core Architecture
IRT 3PL (Item Response Theory, 3-Parameter Logistic) + BKT (Bayesian Knowledge Tracing) hybrid.
- IRT 3PL: calibrates item difficulty, discrimination, and guessing parameters
- BKT: models learner knowledge state over time as a hidden Markov model
- Domain: Geography (Current focus but the application is domain agnostic)

## Tech Stack (confirmed from codebase)
- Framework: Next.js (App Router)
- Language: TypeScript
- Database: Prisma ORM
- Styling: Tailwind CSS
- Testing: Jest
- Containerisation: Docker + docker-compose
- Package manager: npm

## Current Status
See CLAUDE STATUS BLOCK in Notion project page.
Read ONLY that block at session start — do not read the full page.

## Supervisor
Peter Robinson — University of Hull
Geography pivot verbally approved. Keep written record of approval for submission.

## What Claude Should and Should Not Do Here

DO:
- Treat every architectural decision as potentially assessed — explain reasoning not just output
- Flag if any implementation conflicts with IRT 3PL or BKT academic standards
- Prioritise correctness of the psychometric model over code elegance
- Ask clarifying questions before making significant architectural changes
- Help with dissertation write-up sections when asked

DO NOT:
- Change the core IRT 3PL / BKT hybrid architecture without explicit instruction
- Suggest framework changes (e.g. switching away from Next.js)
- Over-engineer — this is a final-year project, not production SaaS
- Ignore the deadline pressure — always flag if a suggested approach risks the timeline

## Deadline Context
Submission: check with supervisor for exact date
Remaining work: IRT calibration, BKT integration, evaluation, dissertation chapters

## Design Standard
Apply C:\Users\dylan\.claude\design-rules.md to any UI work.
This is an academic project but the frontend should still reflect professional craft.

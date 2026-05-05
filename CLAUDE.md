\# CLAUDE.md — E-Learning Final Project



\## Project

Adaptive e-learning system for UK KS3/GCSE Geography.

Algorithm: Hybrid IRT (3PL) + BKT with K-Means cold-start clustering.

Live: https://e-learning-final-project.vercel.app

Repo: https://github.com/dlalloyd/E-Learning-Final-Project



\## Stack

\- Next.js (App Router) + Tailwind CSS

\- Supabase (PostgreSQL, Frankfurt) + Prisma ORM

\- Vercel deployment

\- Build: `prisma generate \&\& next build`



\## Key Files

\- `lib/adaptive-engine.ts` — IRT+BKT hybrid core

\- `components/InstructionMode.tsx` — Sectioned instruction cards, swipe navigation, ELI5 toggle

\- `components/SessionSummaryDashboard.tsx` — Progress Dashboard (commit bedcad3)

\- `prisma/seed-templates.ts` — 13 KC question bank seed

\- `app/api/next-question/` — draws from QuestionTemplate/QuestionVariant pipeline



\## 13 Knowledge Components

Tectonic hazards, Weather hazards, Climate change, Ecosystems,

Urban issues, Changing economic world, Resource management,

Physical landscapes UK, Glacial landscapes, Fieldwork \& skills,

Map skills, Development \& globalisation, Geographical enquiry



\## Known Bug

None. Review Material flow resolved — ref-based handleInstructionComplete

correctly returns to same question (trigger=user_request + hasQuestion=true path).



\## Rules

\- Always `prisma generate` before `next build`

\- PowerShell files: use `Out-File -Encoding ascii` (never here-strings)

\- Surgical line edits when `.Replace()` fails: `$lines\[0..N]` splicing

\- Run `npx prisma db seed` after schema changes on cloud DB

\- React 18 Strict Mode double-invokes in dev — not a data bug



\## Algorithms

IRT 3PL: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))

Target P ≈ 0.70 (ZPD operationalised)

BKT mastery gate: p(Know) ≥ 0.80 per KC before progression

Decayed KCs get discrimination boost (Successive Relearning)



\## Study

n ≥ 15 participants, 7-day retention follow-up

Supervisor: Peter Robinson | Deadline: 06 May 2026


# GeoMentor — Adaptive E-Learning System

Adaptive intelligent tutoring system for UK KS3/GCSE Geography. Personalises question difficulty in real time using a hybrid IRT 3PL + Bayesian Knowledge Tracing algorithm and tracks per-topic mastery across 13 knowledge components.

Live deployment: https://e-learning-final-project.vercel.app

## Project Overview

**Research context:** Randomised controlled study comparing adaptive (IRT+BKT) vs static (fixed-difficulty) question sequencing. Participants are randomly assigned to condition at signup. The admin dashboard tracks θ gain per condition for dissertation analysis.

**Core objectives:**
- Implement IRT 3PL for real-time ability estimation (θ)
- Implement BKT for per-KC mastery tracking with minimum 5 presentation gate
- Sequence questions to target P(correct) ≈ 0.70 (zone of proximal development)
- Trigger instruction mode when mastery drops or consecutive failures threshold is hit
- Collect SUS usability scores and cognitive load ratings for evaluation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, TypeScript |
| Database | PostgreSQL (Supabase, Frankfurt), Prisma ORM |
| Auth | JWT (httpOnly cookie), bcrypt, in-memory rate limiting |
| Maps | Mapbox GL JS (live reference maps in instruction mode) |
| Email | Resend (password reset) |
| Error tracking | Sentry |
| Deployment | Vercel |
| Testing | Jest, React Testing Library |
| Containerisation | Docker, Docker Compose |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── sessions/      # Session create, next-question, answer
│   │   │   ├── auth/          # Login, signup, logout, password reset
│   │   │   ├── admin/         # Study dashboard (admin only)
│   │   │   ├── xp/            # XP and level system
│   │   │   ├── progress/      # Cross-session KC progress
│   │   │   ├── learning-objects/  # Instructional content by KC
│   │   │   ├── sus/           # SUS usability questionnaire
│   │   │   └── ...            # Analytics, leaderboard, goals, etc.
│   │   ├── page.tsx           # Main quiz application (all states)
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── SessionSummaryDashboard.tsx
│   │   ├── InstructionMode.tsx (lives at /components root)
│   │   ├── ProgressDashboard.tsx
│   │   ├── PauseMenu.tsx
│   │   └── ...
│   └── lib/
│       ├── algorithms/
│       │   ├── irt.ts         # IRT 3PL: P(θ) = c + (1-c)/(1+e^(-a(θ-b)))
│       │   ├── bkt.ts         # Bayesian Knowledge Tracing
│       │   ├── mastery.ts     # Mastery gate logic
│       │   └── elo.ts         # Legacy (not used in main flow)
│       ├── auth/              # JWT, bcrypt, rate limiting
│       ├── db/                # Prisma client
│       ├── hooks/             # React hooks (useSfx, useSessionMode)
│       ├── achievements.ts    # XP + level calculations
│       └── sessionFlow.ts     # Condition explainer / SUS trigger gates
├── components/                # Additional components (InstructionMode, etc.)
├── __tests__/
│   ├── irt.test.ts
│   ├── bkt.test.ts
│   └── sessionFlow.test.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed-templates.ts      # 13 KC question bank with IRT parameters
├── public/                    # Static assets, audio SFX
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase project)

### Installation

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=          # PostgreSQL connection string (pooled)
DIRECT_URL=            # PostgreSQL direct connection (for migrations)
JWT_SECRET=            # Random secret for JWT signing
RESEND_API_KEY=        # Resend.dev key for password reset emails
NEXT_PUBLIC_MAPBOX_TOKEN=  # Mapbox public token for reference maps
```

### Database setup

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npx prisma generate && npm run build
```

### Testing

```bash
npm test                  # Run all tests
npm run test:coverage     # Coverage report
```

### Docker (optional)

```bash
docker-compose up --build
```

## Core Algorithms

### IRT 3PL (Item Response Theory, 3-Parameter Logistic)

```
P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```

- `θ` — learner ability estimate (logit scale, initialised at -0.780)
- `a` — item discrimination
- `b` — item difficulty
- `c` — pseudo-guessing parameter

θ is updated after each answer using maximum likelihood estimation. Questions are selected to target P ≈ 0.70 (zone of proximal development, Vygotsky 1978).

### BKT (Bayesian Knowledge Tracing)

Tracks P(Learned) per knowledge component:

```
P(Learned | correct) = P(Learned) * P(correct | known) / P(correct)
```

Parameters: P(L0), P(T), P(S), P(G) per KC. Mastery gate: P(Learned) ≥ 0.80 with minimum 5 presentations (prevents false mastery on lucky streaks).

### Instruction mode triggers (adaptive condition only)

- P(Learned) < 0.30 after a wrong answer → fetch learning content for that KC
- 3 consecutive wrong answers → full topic review
- User clicks "Review" button → return to same question after review

### Successive Relearning

Decayed KCs (not practised in 7+ days) receive a discrimination boost on next encounter, targeting re-encoding rather than surface retrieval.

## 13 Knowledge Components

| ID | Topic |
|---|---|
| tectonic_hazards | Tectonic Hazards |
| weather_hazards | Weather Hazards |
| climate_change | Climate Change |
| ecosystems | Ecosystems |
| urban_issues | Urban Issues |
| changing_economic_world | Changing Economic World |
| resource_management | Resource Management |
| physical_landscapes_uk | Physical Landscapes UK |
| glacial_landscapes | Glacial Landscapes |
| fieldwork_skills | Fieldwork & Skills |
| map_skills | Map Skills |
| development_globalisation | Development & Globalisation |
| geographical_enquiry | Geographical Enquiry |

## Admin Dashboard

Available at `/admin` (admin role required). Shows:

- Per-participant θ start/end, accuracy, session time, SUS score
- Condition breakdown: adaptive vs static avg θ gain (core research comparison)
- KC mastery heatmap across all participants
- CSV export for SPSS/R analysis

## License

See [LICENSE](LICENSE) file

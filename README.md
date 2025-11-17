# E-Learning Adaptive System

Personalised E-Learning System with Adaptive Assessments that dynamically adapts to individual learning patterns through intelligent assessment algorithms.

## Project Overview

**Primary Objectives:**
- Analyse existing adaptive learning approaches
- Design and implement a rule-based adaptive assessment system that:
  - Adjusts question difficulty using Elo rating system (Elo, 1978)
  - Sequences learning content based on mastery thresholds (≥80% accuracy)
  - Logs all user interactions in PostgreSQL
  - Achieves ≥90% unit test coverage (Jest)
- Develop responsive web interface with progress tracking
- Evaluate system through usability testing

**Secondary Objectives:**
- Integrate gamification features (badges, levels)
- Experiment with simple ML models (logistic regression) vs rule-based logic

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, TypeScript
- **Database:** PostgreSQL 15, Prisma ORM
- **Testing:** Jest, React Testing Library (≥90% coverage target)
- **Containerization:** Docker, Docker Compose
- **Admin Panel:** Adminer

## Project Structure

```
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # Backend API routes
│   │   ├── page.tsx           # Home page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── lib/
│   │   ├── algorithms/        # Core adaptive logic
│   │   │   ├── elo.ts        # Elo rating system
│   │   │   └── mastery.ts    # Mastery threshold logic
│   │   └── db/               # Database utilities
│   └── types/                # TypeScript types
├── __tests__/                 # Test files
├── prisma/
│   └── schema.prisma         # Database schema
├── docker-compose.yml        # Docker services
├── Dockerfile               # App container config
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- PostgreSQL 15

### Installation

1. **Clone repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Setup Prisma:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

### Development

**Run locally:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Run with Docker:**
```bash
docker-compose up --build
```

### Testing

```bash
npm test              # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```
Target: ≥90% coverage

## Database Schema

Core models:
- **User** - Learner/Instructor/Admin
- **Topic** - Learning topics with prerequisites
- **Lesson** - Content units
- **Quiz** - Assessments
- **Question** - Quiz items with Elo ratings
- **Assessment** - User attempts
- **UserProgress** - Mastery tracking (≥80% threshold)
- **Badge** - Gamification

## Core Algorithms

### Elo Rating System
- Initial: 1500
- K-factor: 32
- Difficulty: Very Easy to Very Hard

### Mastery Threshold
- Mastery: ≥80% accuracy
- Skip: ≥60% after 3 attempts
- Review: Continue practice

## License

See [LICENSE](LICENSE) file
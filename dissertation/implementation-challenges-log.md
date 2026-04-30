# Implementation Challenges Log
# GeoMentor — Honours Stage Project 2025–26
# Dylan Alloyd | University of Hull
#
# This is a raw working document. Select items for inclusion in the
# Discussion / Limitations / CSSE Reflection chapters as appropriate.
# Evidence column contains git commit hash or DB query reference.

---

## 1. K-Means Cold-Start Superseded Late in Development
**When:** Sprint 6 (Dec 2025 → Jan 2026)
**Evidence:** Commit `95ad272` area; methodology mentions "K-means supersession"
**What happened:** K-Means clustering was designed as the cold-start seeding mechanism — new users would be clustered into ability groups based on a pre-test before IRT estimation began. During implementation it became clear that the 3PL model's EAP estimation converges rapidly even without a pre-test seed, making K-Means redundant for the question counts involved. The feature was removed and replaced with a fixed θ₀ = 0 prior with early-session EAP convergence. Three sprint cycles of calibration work for the clustering pipeline were effectively superseded.
**Dissertation angle:** Engineering judgement — recognising when a designed feature adds complexity without adding value and removing it deliberately rather than shipping dead code. Also demonstrates respond-to-change (CSSE CP2).

---

## 2. EAP Grid Resolution Too Coarse — Rounding Artefacts in Ability Estimates
**When:** Sprint 7 (Jan–Feb 2026)
**Evidence:** commit history for `src/lib/algorithms/irt.ts`; dissertation mentions "EAP grid resolution issue"
**What happened:** The initial EAP integration used a 21-point quadrature grid (−3 to +3 in steps of 0.3). At low and high ability, the discretisation produced stepped rather than smooth θ trajectories — learners would answer several questions with no θ change, then jump by 0.3. Detected during algorithm validation. Fixed by extending to a 161-point grid (−4 to +4, step 0.05). The finer resolution also resolved a secondary bug where Fisher information rankings changed order depending on which discrete θ bin a learner fell in.
**Dissertation angle:** Numerical methods subtlety — clean mathematics does not survive contact with a fixed-precision implementation unchanged. Validates the need for algorithmic unit testing before integration.

---

## 3. Review Material Bug — Persistent Unresolved Regression
**When:** Identified Sprint 8 (Feb–Mar 2026), still present at submission
**Evidence:** `components/InstructionMode.tsx`; CLAUDE.md "Known Bug" section
**What happened:** After a learner completes a Review Material (instruction) interlude, `onComplete()` fires correctly in InstructionMode.tsx, but somewhere in the render path an unexpected `setAppState('start')` is triggered, returning the user to the start screen instead of continuing the session. Root cause not isolated before submission deadline. The bug is intermittent in development due to React 18 Strict Mode's double-invocation of effects, which obscured the reproducer.
**Dissertation angle:** Honest disclosure. Some bugs are found, documented, and not fixed — this is normal in software engineering. What matters is that the bug is characterised, its impact bounded (only triggers on Review Material path, not on standard question flow), and it is disclosed rather than concealed. Demonstrates integrity over impression management.

---

## 4. Condition Assignment Never Wired — Self-Selection Bias Introduced
**When:** Discovered May 2026 (Sprint 10), fixed commit `a9e61e1`
**Evidence:** `prisma/schema.prisma` commit `c1ef0bf` added `studyCondition` Apr 21; `signup/route.ts` never set it; all 4 completed participant sessions show `condition: 'adaptive'` in DB
**What happened:** The `studyCondition` field was added to the User schema with the intent of assigning participants randomly at signup. The signup API route was never updated to populate the field, so it defaulted to `'adaptive'` via the Prisma schema default. The ConditionExplainer component was implemented as a two-button choice UI, meaning participants who did see it could self-select their condition — the opposite of random assignment. Discovered when cross-checking dissertation claims against the actual implementation. All four evaluation participants were in the adaptive condition; the static arm never activated. Fixed at commit `a9e61e1`: random 50/50 assignment at signup, ConditionExplainer converted to informational display.
**Dissertation angle:** Classic late-integration discovery. The schema was correct; the data flow was incomplete. This is exactly the kind of bug that code review catches but solo development misses. Also: honest reporting of the AB design failure is important — all four participants received adaptive, so the comparison with VanLehn's benchmark is the only available comparator.

---

## 5. ResearchConsent Records Missing for All Evaluation Participants
**When:** Discovered May 2026 (Sprint 10)
**Evidence:** DB query — `SELECT * FROM "ResearchConsent"` returns 1 record (researcher's own, P02); participants P01/P03/P04/P05 have no consent records
**What happened:** The ResearchConsent table and the signup-side `researchConsent.create` call were added in commit `95ad272` on Apr 23. The four evaluation participants registered on Apr 20–21 — before this feature existed. Their consent was captured via the physical consent form administered during the evaluation sessions but was not recorded in the database. The consent checkbox on the UI was added as a requirement retrospectively.
**Dissertation angle:** Demonstrates the hazard of adding ethical compliance infrastructure after data collection has begun. The physical consent forms remain as evidence of informed consent. This is a procedural gap, not an ethical violation, but it represents the kind of ordering problem that a pre-registration study protocol would have prevented.

---

## 6. IRT Parameter Calibration on Sparse Data
**When:** Sprint 4–5 (Nov–Dec 2025)
**Evidence:** Methodology chapter, Section on IRT calibration pipeline
**What happened:** The 3PL model requires sufficient response data per item to estimate discrimination (a), difficulty (b), and guessing (c) parameters stably. Standard guidance suggests ≥200 responses per item for reliable 3PL estimation. The calibration sample was substantially smaller. The c parameter was fixed at 0.25 (four-option MCQ guessing floor) to reduce the degrees of freedom; RMSEA was monitored as a fit statistic. Even so, the standard errors on a estimates are large, meaning Fisher information rankings are approximate rather than precise.
**Dissertation angle:** Psychometric honesty. The system works correctly given the parameters it has, but the parameters themselves carry uncertainty. Any effect size claims are therefore doubly uncertain: uncertain due to small n in the evaluation study, and uncertain due to imprecise item parameters.

---

## 7. Participant Recruitment Shortfall — Target n=15, Achieved n=4
**When:** Sprint 9–10 (Apr–May 2026)
**Evidence:** Discussion chapter; database shows 4 completed participants
**What happened:** Recruitment via University of Hull participant pools and departmental email lists produced fewer completed sessions than anticipated. Several factors: (a) the exclusion criterion (no prior GCSE Geography) eliminated a substantial proportion of Hull CS students who had studied Geography at school; (b) participants who started but did not complete their session contributed partial data only (3 identified: Issy 4q, Dylan Cromarty 8q, Esme 0q); (c) the evaluation window was compressed by the Sprint 5 scope-reduction decision, leaving less calendar time for snowball recruitment. The 7-day retention follow-up was therefore administered to fewer participants than planned.
**Dissertation angle:** Transparent reporting of recruitment failure is required — n=4 is the fact on the ground and it determines which statistical methods are and are not available. The multi-method evaluation framework was adopted precisely because inferential statistics are not viable at this n.

---

## 8. Partial Session Abandonments — Three Participants With Incomplete Data
**When:** Apr 2026 (evaluation window)
**Evidence:** DB query — 3 users with sessions but completedAt = null; question counts: 4, 8, 0
**What happened:** Three participants began but did not complete their evaluation sessions. Their partial θ trajectories exist in the database but cannot be included in the within-session Δθ analysis because no pre/post pair exists. This is itself informative: dropout before session completion suggests either interface friction, motivational factors, or time constraints — all ecologically relevant to real-world deployment.
**Dissertation angle:** Partial session data as engagement evidence. The fact that sessions were started confirms the system was reachable and functional. The dropout pattern is consistent with voluntary digital learning contexts (Khan Academy reports similar abandonment curves). Can be noted under ecological validity.

---

## 9. Static Condition Never Activated in Practice
**When:** Apr 2026 (evaluation window)
**Evidence:** DB query — all sessions show `condition: 'adaptive'`
**What happened:** Related to Challenge 4 (condition assignment bug). Because all participants defaulted to the adaptive condition, the static question-sequencing branch (which IS correctly implemented in `next-question/route.ts`, sorting items by difficulty rather than Fisher information) was never used in live evaluation. The control arm existed in the code but not in the data.
**Dissertation angle:** Limits the strength of the empirical claim. The adaptive vs static comparison reduces to adaptive vs VanLehn's meta-analytic baseline rather than an internal within-study comparison. This is disclosed honestly as a limitation of the evaluation design.

---

## 10. Vercel Deployment TypeScript Build Gate Failures
**When:** Recurring across Sprints 6–9
**Evidence:** Vercel deployment log history; multiple commits with "fix(types)" or "fix(build)" prefixes
**What happened:** Vercel runs `tsc --noEmit` as part of the build pipeline. TypeScript strict mode means that type errors which compile locally (with certain IDE settings) block production deployment. Over the course of development, this gate fired repeatedly — particularly around Prisma-generated types after schema migrations (Prisma regenerates types on `prisma generate`; forgetting to run this before committing broke the build), and around React component prop types when refactoring. Each failure required a follow-up fix commit, adding friction to the release cycle.
**Dissertation angle:** Quality assurance by the build gate. Each failure detected a real type error before it reached production users. The Vercel CI gate is more reliable than manual testing for type correctness. Demonstrates that TypeScript strict mode in a deployment pipeline is a quality assurance mechanism, not a bureaucratic overhead.

---

## 11. Prisma Migration State Drift Between Local and Cloud DB
**When:** Sprints 5–7
**Evidence:** CLAUDE.md rule: "Always `prisma generate` before `next build`"
**What happened:** Local development used a Prisma SQLite mirror at various points; production uses Supabase PostgreSQL. Schema migrations applied locally did not always reflect what was live in cloud. On at least two occasions a feature that worked in development (using a schema field that existed locally but not yet in cloud) failed silently in production until `npx prisma db push` or `npx prisma db seed` was run against the cloud DB. The CLAUDE.md rule was added after the second occurrence.
**Dissertation angle:** Classic local/cloud environment divergence. Demonstrates why environment parity matters and why the "works on my machine" failure mode is a real engineering risk in database-backed web applications.

---

## 12. Supabase Row-Level Security Left Disabled on 33 Tables
**When:** Discovered Apr 2026 (Sprint 10), fixed by migration `rls_policies_complete`
**Evidence:** Supabase Security Advisor showed 6 ERROR-level (RLS disabled) and 27 INFO-level (RLS enabled, no policies) tables
**What happened:** Supabase enables RLS-disabled tables to be queried directly via the public API without authentication — a critical security exposure for a system holding participant data. RLS was enabled on the core tables (User, Session, Response) but 33 secondary tables (SUSResponse, ResearchConsent, XPEvent, etc.) were left without policies. Fixed by applying a single migration adding appropriate policies (authenticated_select for content tables, no_direct_access for user-data tables).
**Dissertation angle:** Security hardening discovered late. The advisor tool identified the gap; the fix was applied before submission. Demonstrates that security is not a one-time checkpoint but an ongoing audit. Also relevant to UK GDPR compliance — participant data tables with no RLS represent a potential data protection gap.

---

## 13. BKT Credit-Factor Boundary Case — Division by Zero Risk
**When:** Sprint 5 (Nov–Dec 2025)
**Evidence:** `src/lib/algorithms/bkt.ts`
**What happened:** The credit-factor modification to the BKT transition equation interpolates between the full Bayesian posterior and the prior in proportion to the hint level accessed (0 = full credit, 3 = no credit). An early implementation had a boundary case where creditFactor = 0 produced a division-by-zero in the interpolation formula when the denominator term resolved to zero for certain prior values. Caught during unit testing of the BKT module. Fixed by clamping creditFactor to (0, 1] before the computation.
**Dissertation angle:** Algorithmic implementation subtlety. Clean mathematical formulations do not always survive translation to floating-point arithmetic. Unit testing the algorithm in isolation before integrating it into the session loop is what caught this before it could corrupt BKT state.

---

## 14. Bloom's Taxonomy Gate Ordering Produced Unexpected Skips
**When:** Sprint 6 (Jan 2026)
**Evidence:** Algorithm validation tests, methodology section on Bloom-gating
**What happened:** The Bloom-gated selection algorithm was designed to prevent learners from seeing Bloom Level 2+ items until p(Learned) ≥ 0.80 for at least one Level 1 item in the same KC. In the initial implementation, the gate used a strict AND across all Level 1 items in a KC — requiring all Level 1 items to be mastered before any Level 2 item could appear. For KCs with 4–5 Level 1 items, this produced very long sequences at the lowest Bloom level before any progression occurred. The gate logic was revised to require p(Learned) ≥ 0.80 for at least one Level 1 item (not all), which better reflected the intended pedagogical design.
**Dissertation angle:** Gap between specification and implementation. The original specification said "mastery at Level 1 before Level 2" without defining what mastery at Level 1 meant quantitatively for a KC with multiple Level 1 items. Implementation forced a precise definition that the specification had elided.

---

## 15. Frontend State Management Race Condition on Session Resume
**When:** Sprint 7–8 (Feb 2026)
**Evidence:** `src/app/page.tsx` comments; React Strict Mode note in CLAUDE.md
**What happened:** When a user with an incomplete session logged in, the auto-login useEffect fetched `/api/auth/me`, set userId/sessionId from the incomplete session, and then triggered `fetchNextQuestion`. Under React 18 Strict Mode (development only), effects fire twice — meaning `fetchNextQuestion` was called twice in rapid succession, creating two in-flight requests to `/api/sessions/[id]/next-question`. The second request returned a different question than the first because θ had been updated by the first request's response. This produced a flickering "wrong question" visible in development. Not reproducible in production (Strict Mode off) but required careful useEffect dependency management to eliminate.
**Dissertation angle:** React 18 development/production divergence. The Strict Mode double-invocation is intentional — it surfaces bugs that would otherwise be hidden by accidental idempotency. The fix (ensuring `fetchNextQuestion` is idempotent with respect to concurrent calls) made the production code more robust, even though the visible symptom only appeared in development.

---

## 16. Overleaf Compiler Timeout on pgfgantt Diagram
**When:** Apr 2026 (dissertation write-up phase)
**Evidence:** `dissertation/main.tex` — `\usepackage{pgfgantt}` removed; Gantt replaced with tabularX table
**What happened:** The original dissertation included a TikZ/pgfgantt Gantt chart for the project timeline. On Overleaf's free tier, the LaTeX compilation timeout was being triggered by the pgfgantt rendering pass. The Gantt was replaced with a tabularX table encoding the same sprint timeline information, which compiles in under 2 seconds. The visual richness of the diagram was lost, but dissertation compilation reliability was restored.
**Dissertation angle:** Tool constraint shaping output. Overleaf's compilation limits are a real constraint on dissertation production — not every feature of a tool is available in all contexts. Pragmatic engineering: choose the solution that meets the requirement (communicate timeline) within the constraint (compile in under 2s), not the aesthetically preferred one.

---

## 17. UTF-8 BOM in LaTeX Files Causing Silent Compile Failures
**When:** Apr–May 2026 (dissertation write-up phase)
**Evidence:** Python BOM-stripping applied to `05_results.tex` and `06_discussion.tex`
**What happened:** Two dissertation chapter files exported from a Windows editor had a UTF-8 BOM (0xEF 0xBB 0xBF) prepended. LaTeX with `[utf8]{inputenc}` does not handle the BOM gracefully — it either produces a spurious character at the start of the chapter or causes a silent parse error in certain environments. Detected when chapter content was rendering with an unexpected leading character. Fixed by stripping the BOM with a Python script.
**Dissertation angle:** Encoding hygiene. UTF-8 BOM is a Windows-specific encoding artefact that causes no problems in Windows-native tools but creates compatibility issues in Unix-origin toolchains like LaTeX. Cross-platform development requires awareness of encoding assumptions.

---

## 18. Cross-Reference Type Mismatch — `\ref{fig:gantt}` in Table Context
**When:** May 2026
**Evidence:** `dissertation/chapters/03_methodology.tex` — `\label{fig:gantt}` inside `\begin{table}` environment
**What happened:** After the Gantt was converted from a TikZ figure to a tabularX table, the `\label` was still named `fig:gantt` and the prose still used `Figure~\ref{fig:gantt}`. LaTeX cross-references resolve numerically and do not validate the label prefix against the environment — so this compiled without error but produced "Figure X" in the text when the element was actually a table. Fixed by renaming label to `tab:gantt` and updating the prose references.
**Dissertation angle:** A silent correctness error that typechecking would have caught. LaTeX's permissive cross-reference system does not enforce label naming conventions — the error was invisible until the compiled PDF was read carefully. Demonstrates that compiler success does not equal semantic correctness.

---

## 19. AI Declaration Scope Creep — Boundary Harder to Draw Than Expected
**When:** Throughout development; documented Apr–May 2026
**Evidence:** Introduction chapter, AI Declaration appendix
**What happened:** University of Hull policy requires explicit declaration of AI tool usage. The boundary between "AI-assisted" and "author-designed" was harder to draw cleanly than anticipated. Authentication boilerplate (NextAuth configuration), UI scaffolding, and Vercel configuration were clearly AI-assisted. The IRT calibration strategy, BKT credit-factor modification, KC ontology, and research design were clearly author-designed. The grey area: the adaptive engine's core algorithm was author-designed but implemented with AI assistance for the TypeScript syntax of the Prisma queries and EAP integration loop. The declaration errs toward transparency — declaring assistance where uncertain rather than claiming authorship where the boundary is unclear.
**Dissertation angle:** Intellectual honesty about AI-assisted development. The declaration is not a confession of weakness but a demonstration of integrity. Knowing what you designed versus what you scaffolded with AI assistance requires genuine metacognitive awareness of your own development process.

---

## 20. Misconception Analysis Dependent on Distractor Quality — Post-Hoc Limitation
**When:** Sprint 9–10 (evaluation phase)
**Evidence:** Results chapter, Track 4 (misconception analysis)
**What happened:** The misconception tab identifies which wrong answer a participant selected and maps it to a labelled distractor. The quality of misconception analysis is therefore directly dependent on the quality of distractor authoring. Several question items in the bank had generic distractors ("None of the above", "All of the above", "I don't know") rather than theory-grounded misconception-labelled options. These items produce no useful misconception signal. Identified post-hoc during evaluation analysis — by which point the question bank was fixed for the evaluation and could not be revised without invalidating the calibration.
**Dissertation angle:** Content authoring as a limitation on algorithmic output. The algorithm is only as informative as the content it operates on. Misconception-labelled distractors require pedagogical design expertise at authoring time — a constraint that applies to any ITS deploying MCQ-based misconception detection.

---

## Summary Table for Quick Reference

| # | Challenge | Stage | Resolved? |
|---|-----------|-------|-----------|
| 1 | K-Means superseded by EAP convergence | Sprint 6 | Yes — removed |
| 2 | EAP grid resolution too coarse | Sprint 7 | Yes — 161-point grid |
| 3 | Review Material bug | Sprint 8 | No — disclosed |
| 4 | Condition assignment never wired | Sprint 10 | Yes — `a9e61e1` |
| 5 | ResearchConsent missing for participants | Sprint 10 | Partial — physical forms exist |
| 6 | IRT calibration on sparse data | Sprint 4–5 | Mitigated — c fixed, RMSEA monitored |
| 7 | Participant recruitment shortfall | Sprint 9–10 | No — n=4 final |
| 8 | Partial session abandonments | Sprint 10 | Documented |
| 9 | Static condition never activated | Sprint 10 | Documented |
| 10 | Vercel TypeScript build gate failures | Recurring | Yes — each resolved at time |
| 11 | Prisma local/cloud schema drift | Sprints 5–7 | Yes — process rule added |
| 12 | Supabase RLS disabled on 33 tables | Sprint 10 | Yes — migration applied |
| 13 | BKT credit-factor division by zero | Sprint 5 | Yes — clamped |
| 14 | Bloom gate ordering too strict | Sprint 6 | Yes — gate logic revised |
| 15 | React Strict Mode race condition on resume | Sprint 7–8 | Yes — idempotent fix |
| 16 | Overleaf pgfgantt timeout | Writeup | Yes — replaced with table |
| 17 | UTF-8 BOM in .tex files | Writeup | Yes — BOM stripped |
| 18 | Cross-reference type mismatch (fig vs table) | Writeup | Yes — label renamed |
| 19 | AI declaration boundary unclear | Throughout | Yes — declared conservatively |
| 20 | Distractor quality limits misconception analysis | Sprint 10 | Documented as limitation |

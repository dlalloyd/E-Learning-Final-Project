-- Enable RLS on all public tables.
-- GeoMentor connects via Prisma (direct Postgres), not PostgREST, so RLS
-- does not gate the application data path. Enabling it closes the Supabase
-- REST API surface as a defense-in-depth measure.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TopicPrerequisite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Option" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LearningObject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrerequisiteEdge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSessionState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KCMastery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuestionTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuestionVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VariantPresentation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfidenceCalibration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessionSummary" ENABLE ROW LEVEL SECURITY;

-- Performance indexes on frequently queried foreign keys
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_quizId_idx" ON "Session"("quizId");
CREATE INDEX IF NOT EXISTS "Interaction_sessionId_idx" ON "Interaction"("sessionId");
CREATE INDEX IF NOT EXISTS "Interaction_questionId_idx" ON "Interaction"("questionId");
CREATE INDEX IF NOT EXISTS "Assessment_userId_idx" ON "Assessment"("userId");
CREATE INDEX IF NOT EXISTS "Assessment_sessionId_idx" ON "Assessment"("sessionId");
CREATE INDEX IF NOT EXISTS "Assessment_quizId_idx" ON "Assessment"("quizId");
CREATE INDEX IF NOT EXISTS "Answer_assessmentId_idx" ON "Answer"("assessmentId");
CREATE INDEX IF NOT EXISTS "Answer_questionId_idx" ON "Answer"("questionId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "Hint_questionId_idx" ON "Hint"("questionId");
CREATE INDEX IF NOT EXISTS "Option_questionId_idx" ON "Option"("questionId");
CREATE INDEX IF NOT EXISTS "Question_quizId_idx" ON "Question"("quizId");
CREATE INDEX IF NOT EXISTS "LearningObject_kcId_idx" ON "LearningObject"("knowledgeComponentId");

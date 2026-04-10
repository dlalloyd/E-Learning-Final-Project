-- CreateTable
CREATE TABLE "UserVariantSeen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVariantSeen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVariantSeen_userId_idx" ON "UserVariantSeen"("userId");
CREATE INDEX "UserVariantSeen_variantId_idx" ON "UserVariantSeen"("variantId");
CREATE UNIQUE INDEX "UserVariantSeen_userId_variantId_key" ON "UserVariantSeen"("userId", "variantId");

-- AddForeignKey
ALTER TABLE "UserVariantSeen" ADD CONSTRAINT "UserVariantSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserVariantSeen" ADD CONSTRAINT "UserVariantSeen_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "QuestionVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "UserVariantSeen" ENABLE ROW LEVEL SECURITY;

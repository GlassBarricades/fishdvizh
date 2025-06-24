-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1000;

-- CreateTable
CREATE TABLE "EventResult" (
    "id" TEXT NOT NULL,
    "fishingEventId" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "ratingChange" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRatingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fishingEventId" TEXT,
    "oldRating" INTEGER NOT NULL,
    "newRating" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRatingHistory" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fishingEventId" TEXT,
    "oldRating" INTEGER NOT NULL,
    "newRating" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventResult_fishingEventId_participantType_participantId_key" ON "EventResult"("fishingEventId", "participantType", "participantId");

-- AddForeignKey
ALTER TABLE "EventResult" ADD CONSTRAINT "EventResult_fishingEventId_fkey" FOREIGN KEY ("fishingEventId") REFERENCES "FishingEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRatingHistory" ADD CONSTRAINT "UserRatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRatingHistory" ADD CONSTRAINT "TeamRatingHistory_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

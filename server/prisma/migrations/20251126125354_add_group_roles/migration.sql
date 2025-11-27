-- 1. CreateEnum (Idempotent-ish, throws if exists but usually fine in Prisma flow)
-- We wrap this in a block to prevent error if type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupRole') THEN
        CREATE TYPE "GroupRole" AS ENUM ('MEMBER', 'ADMIN');
    END IF;
END$$;

-- 2. Create the NEW table
CREATE TABLE "GroupMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- 3. DATA MIGRATION (The Safe Part)
-- This block checks if _GroupToUser exists. If yes, it copies data.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_GroupToUser') THEN
        INSERT INTO "GroupMember" ("groupId", "userId", "role", "createdAt")
        SELECT "A", "B", 'MEMBER', NOW()
        FROM "_GroupToUser";
    END IF;
END $$;

-- 4. Drop the old table (Safe Drop)
-- We use IF EXISTS so it doesn't crash if the table is already gone
DROP TABLE IF EXISTS "_GroupToUser" CASCADE;

-- 5. Create Indexes and Foreign Keys
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
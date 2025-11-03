-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('SUBSECTION', 'ARTICLE');

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "confluenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pageType" "PageType" NOT NULL,
    "parentConfluenceId" TEXT,
    "authorName" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PageToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PageToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_confluenceId_key" ON "Page"("confluenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_parentConfluenceId_idx" ON "Page"("parentConfluenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "_PageToTag_B_index" ON "_PageToTag"("B");

-- AddForeignKey
ALTER TABLE "ArticleSubmission" ADD CONSTRAINT "ArticleSubmission_confluencePageId_fkey" FOREIGN KEY ("confluencePageId") REFERENCES "Page"("confluenceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageToTag" ADD CONSTRAINT "_PageToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageToTag" ADD CONSTRAINT "_PageToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

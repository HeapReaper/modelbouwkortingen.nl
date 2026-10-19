-- Eigen bezoekersstatistieken (paginaweergaven zonder bots, zonder cookies of IP-adressen).
-- CreateTable
CREATE TABLE "page_views" (
    "id" BIGSERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "referrer" TEXT,
    "entry" BOOLEAN NOT NULL DEFAULT false,
    "visitor" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_salts" (
    "day" TEXT NOT NULL,
    "salt" TEXT NOT NULL,

    CONSTRAINT "analytics_salts_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE INDEX "page_views_created_idx" ON "page_views"("created_at");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path", "created_at");

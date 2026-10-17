-- CreateTable
CREATE TABLE "discord_subscribers" (
    "id" BIGSERIAL NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "guild_id" TEXT,
    "channel_id" TEXT,
    "name" TEXT,
    "cursor_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cursor_product_id" BIGINT NOT NULL DEFAULT 0,
    "last_posted_at" TIMESTAMPTZ,
    "disabled_at" TIMESTAMPTZ,
    "disabled_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discord_subscribers_webhook_id_key" ON "discord_subscribers"("webhook_id");

-- CreateIndex
CREATE UNIQUE INDEX "discord_subscribers_token_key" ON "discord_subscribers"("token");

-- CreateIndex
CREATE INDEX "discord_subscribers_active_idx" ON "discord_subscribers"("disabled_at");


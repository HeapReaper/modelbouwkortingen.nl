-- Discord-webhooks die gekoppeld zijn terwijl iemand ingelogd was, horen bij dat account.
ALTER TABLE "discord_subscribers" ADD COLUMN "user_id" BIGINT;

-- CreateIndex
CREATE INDEX "discord_subscribers_user_idx" ON "discord_subscribers"("user_id");

-- AddForeignKey
ALTER TABLE "discord_subscribers" ADD CONSTRAINT "discord_subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

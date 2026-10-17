-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'nl';

-- AlterTable
ALTER TABLE "discord_subscribers" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'nl';


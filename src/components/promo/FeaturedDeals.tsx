import { Megaphone } from "lucide-react";
import { DealRow } from "@/components/deals/DealRow";
import { getI18n } from "@/i18n/server";
import { getFeaturedDeals } from "@/lib/promotions";
import { localizeDeals } from "@/lib/translate";

/**
 * Rij met uitgelichte producten (betaalde plaatsingen), eventueel alleen uit één categorie of
 * webshop. Zonder lopende promoties rendert dit niets. Leest de database: binnen <Suspense>.
 */
export async function FeaturedDeals({
  category,
  shop,
  className,
}: {
  category?: string;
  shop?: string;
  className?: string;
}) {
  const { lang, dict } = await getI18n();
  const deals = await localizeDeals(
    await getFeaturedDeals({ category, shop }),
    lang,
  );
  if (deals.length === 0) return null;
  return (
    <DealRow
      title={dict.promo.dealsTitle}
      subtitle={dict.promo.dealsSubtitle}
      deals={deals}
      icon={<Megaphone className="size-7 text-primary" />}
      sponsored
      className={className}
    />
  );
}

import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  categorySlug,
  className,
  eager,
}: {
  src: string | null;
  alt: string;
  categorySlug: string;
  className?: string;
  eager?: boolean;
}) {
  if (!src) {
    const Icon = getCategory(categorySlug)?.icon;
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-muted to-accent text-muted-foreground",
          className,
        )}
      >
        {Icon ? <Icon className="size-1/3" strokeWidth={1.25} /> : null}
      </div>
    );
  }
  return (
    <div className={cn("bg-white p-3", className)}>
      {/* biome-ignore lint/performance/noImgElement: externe webshop-afbeeldingen, niet via de image optimizer */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className="size-full object-contain"
      />
    </div>
  );
}

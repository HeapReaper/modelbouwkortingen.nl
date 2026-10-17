import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { getDeal } from "@/lib/deals";
import { formatEuro } from "@/lib/format";

/**
 * Deelafbeelding (Open Graph, 1200×630) voor een product: foto, naam, prijs, was-prijs en
 * korting. Gekoppeld in generateMetadata() van /product/[id]. Een route handler en geen
 * opengraph-image.tsx in [lang]/product/[id], zodat de URL taalloos is (geen /nl-redirect).
 */

const SIZE = { width: 1200, height: 630 };
const BRAND = "#d2161e"; // --primary uit globals.css
const DEAL = "#f5d03b"; // ≈ --deal uit globals.css ("prijskaartje"-geel)
/** Satori kan geen WebP/AVIF; die foto's laten we weg. */
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Productfoto als data-URL, of null als die niet (snel genoeg) te gebruiken is. */
async function loadImage(url: string | null): Promise<string | null> {
  if (!url?.startsWith("http")) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { accept: IMAGE_TYPES.join(",") },
    });
    const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!res.ok || !IMAGE_TYPES.includes(type)) return null;
    const data = await res.arrayBuffer();
    if (data.byteLength > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${Buffer.from(data).toString("base64")}`;
  } catch {
    return null;
  }
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/og/[id]">,
) {
  await connection();
  const deal = await getDeal(Number((await ctx.params).id));
  if (!deal) return new Response("Not found", { status: 404 });
  const image = await loadImage(deal.imageUrl);
  const showDeal = deal.isDeal && deal.discountPercent > 0;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#fbfaf7",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 560,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRight: "1px solid #e4e4e7",
          position: "relative",
        }}
      >
        {image ? (
          // biome-ignore lint/performance/noImgElement: Satori kent alleen <img>.
          <img
            src={image}
            alt=""
            width={480}
            height={480}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div style={{ fontSize: 120, color: "#d4d4d8" }}>RC</div>
        )}
        {showDeal ? (
          <div
            style={{
              position: "absolute",
              top: 36,
              right: 0,
              background: BRAND,
              color: "#ffffff",
              fontSize: 56,
              fontWeight: 800,
              padding: "10px 26px",
              borderRadius: "16px 0 0 16px",
            }}
          >
            {`-${Math.round(deal.discountPercent)}%`}
          </div>
        ) : null}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#6b6b6b",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {deal.shopName}
          </div>
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: "#12161f",
              lineHeight: 1.15,
            }}
          >
            {truncate(deal.name, 90)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: "#12161f" }}>
              {formatEuro(deal.price)}
            </div>
            {showDeal && deal.referencePrice ? (
              <div
                style={{
                  fontSize: 38,
                  color: "#6b6b6b",
                  textDecoration: "line-through",
                }}
              >
                {formatEuro(deal.referencePrice)}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: DEAL,
              color: "#12161f",
              fontSize: 30,
              fontWeight: 800,
              padding: "10px 20px",
              borderRadius: 12,
              border: "3px solid #12161f",
            }}
          >
            Modelbouwkortingen.nl
          </div>
        </div>
      </div>
    </div>,
    {
      ...SIZE,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}

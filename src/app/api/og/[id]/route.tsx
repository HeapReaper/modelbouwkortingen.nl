import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import sharp from "sharp";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDeal } from "@/lib/deals";
import { formatEuro } from "@/lib/format";
import { localizeDeals } from "@/lib/translate";

/**
 * Deelafbeelding (Open Graph, 1200×630) voor een product: foto, naam, prijs, was-prijs en
 * korting. Gekoppeld in generateMetadata() van /product/[id]. Een route handler en geen
 * opengraph-image.tsx in [lang]/product/[id], zodat de URL taalloos is (geen /nl-redirect).
 * ?lang= bepaalt de taal van de productnaam (vertaalde namen van anderstalige webshops).
 */

const SIZE = { width: 1200, height: 630 };
const BRAND = "#d2161e"; // --primary uit globals.css
const DEAL = "#f5d03b"; // ≈ --deal uit globals.css ("prijskaartje"-geel)
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PHOTO_SIZE = 480;

/** Zelfde lettertypes als de site (Archivo voor koppen, Geist voor tekst); één keer inlezen. */
const fontFile = (name: string) =>
  readFile(join(process.cwd(), "src/assets/fonts", name));
const FONTS = Promise.all([
  fontFile("archivo-latin-800-normal.woff"),
  fontFile("geist-sans-latin-400-normal.woff"),
  fontFile("geist-sans-latin-700-normal.woff"),
]).then(([archivo, geist, geistBold]) => [
  {
    name: "Archivo",
    data: archivo,
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    name: "Geist",
    data: geist,
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Geist",
    data: geistBold,
    weight: 700 as const,
    style: "normal" as const,
  },
]);

/** WordPress-miniatuur ("foto-300x200.webp") → origineel ("foto.webp"); anders null. */
const WP_THUMB_RE = /-\d{2,4}x\d{2,4}(\.\w+)$/;

/**
 * Productfoto als PNG-data-URL, of null als die niet (snel genoeg) te gebruiken is. Bij een
 * WordPress-miniatuur eerst het origineel, want die is vaak te klein en wordt wazig.
 */
async function loadImage(url: string | null): Promise<string | null> {
  if (!url?.startsWith("http")) return null;
  const original = url.replace(WP_THUMB_RE, "$1");
  return (original !== url ? await fetchPng(original) : null) ?? fetchPng(url);
}

/** Satori kan geen WebP/AVIF lezen (veel shops leveren alleen dat), dus alles gaat via sharp naar PNG. */
async function fetchPng(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: {
        accept: "image/*",
        // Sommige shops weigeren verzoeken zonder browserachtige user-agent.
        "user-agent":
          "Mozilla/5.0 (compatible; ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl)",
      },
    });
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    if (data.byteLength > MAX_IMAGE_BYTES) return null;
    const png = await sharp(data, { animated: false })
      .resize(PHOTO_SIZE, PHOTO_SIZE, {
        fit: "inside",
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export async function GET(request: Request, ctx: RouteContext<"/api/og/[id]">) {
  await connection();
  const found = await getDeal(Number((await ctx.params).id));
  if (!found) return new Response("Not found", { status: 404 });
  const langParam = new URL(request.url).searchParams.get("lang");
  const [deal] = await localizeDeals(
    [found],
    hasLocale(langParam) ? langParam : DEFAULT_LOCALE,
  );
  const image = await loadImage(deal.imageUrl);
  const showDeal = deal.isDeal && deal.discountPercent > 0;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#fbfaf7",
        fontFamily: "Geist",
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
          <div
            style={{ fontSize: 120, fontFamily: "Archivo", color: "#d4d4d8" }}
          >
            RC
          </div>
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
              fontFamily: "Archivo",
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
              fontFamily: "Archivo",
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
            <div
              style={{
                fontSize: 76,
                fontFamily: "Archivo",
                fontWeight: 800,
                color: "#12161f",
              }}
            >
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
              fontFamily: "Archivo",
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
      fonts: await FONTS,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}

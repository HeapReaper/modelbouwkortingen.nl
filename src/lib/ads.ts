/**
 * Google AdSense. Het script en de meta-tag staan in src/app/[lang]/layout.tsx, het
 * ads.txt-bestand in public/ads.txt (houd de publisher-ID daar gelijk). Alleen in productie,
 * zodat lokaal testen geen weergaven of kliks oplevert.
 */
export const ADSENSE_CLIENT = "ca-pub-4182887018676693";

export const adsEnabled = process.env.NODE_ENV === "production";

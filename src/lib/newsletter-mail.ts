import "server-only";

import { type Locale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/translate";
import type { Deal } from "@/lib/deals";
import { formatters } from "@/lib/format";
import type { Mail } from "@/lib/mail";
import { productLink } from "@/lib/shops";

// Mailclients ondersteunen nauwelijks moderne CSS: tabellen en inline styles.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl"
).replace(/\/$/, "");

/** Absolute URL naar een pagina in de taal van de abonnee. */
export function siteUrl(lang: Locale, path: string) {
  return SITE_URL + localePath(lang, path);
}

const BRAND = "#d2161e"; // --primary uit globals.css
const TEXT = "#12161f";
const MUTED = "#6b6b6b";

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function layout(opts: {
  lang: Locale;
  preheader: string;
  body: string;
  footer: string;
}): string {
  return `<!doctype html>
<html lang="${opts.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Modelbouwkortingen.nl</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:${BRAND};padding:18px 24px;">
<a href="${siteUrl(opts.lang, "/")}" style="color:#ffffff;text-decoration:none;font-size:22px;font-weight:bold;">Modelbouwkortingen.nl</a>
</td></tr>
<tr><td style="padding:24px;">${opts.body}</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #e4e4e7;font-size:13px;line-height:1.5;color:${MUTED};">${opts.footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px;">${esc(label)}</a>`;
}

export function confirmationMail(
  email: string,
  token: string,
  lang: Locale,
): Mail {
  const m = getDictionary(lang).mail;
  const url = `${siteUrl(lang, "/nieuwsbrief/bevestigen")}?token=${encodeURIComponent(token)}`;
  return {
    to: email,
    subject: m.confirmSubject,
    html: layout({
      lang,
      preheader: m.confirmPreheader,
      body: `<h1 style="margin:0 0 12px;font-size:22px;">${esc(m.confirmHeading)}</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">${esc(m.confirmText)}</p>
<p style="margin:0 0 20px;">${button(url, m.confirmButton)}</p>
<p style="margin:0;font-size:14px;color:${MUTED};">${esc(m.confirmFallback)}<br><a href="${esc(url)}" style="color:${MUTED};word-break:break-all;">${esc(url)}</a></p>`,
      footer: esc(m.confirmFooter),
    }),
    text: `${m.confirmHeading}

${m.confirmText}
${url}

${m.confirmFooter}`,
  };
}

export function digestSubject(deals: Deal[], lang: Locale) {
  const m = getDictionary(lang).mail;
  const percent = Math.round(Math.max(...deals.map((d) => d.discountPercent)));
  return deals.length === 1
    ? t(m.digestSubjectOne, { percent })
    : t(m.digestSubjectOther, { percent, count: deals.length });
}

export function digestMail(
  email: string,
  token: string,
  deals: Deal[],
  lang: Locale,
): Mail {
  const m = getDictionary(lang).mail;
  const fmt = formatters(lang);
  const unsubscribePage = `${siteUrl(lang, "/nieuwsbrief/afmelden")}?token=${encodeURIComponent(token)}`;
  // De one-click-route is taalloos; Gmail/Yahoo posten daar zonder pagina te tonen.
  const oneClick = `${SITE_URL}/api/nieuwsbrief/afmelden?token=${encodeURIComponent(token)}`;
  const allDeals = siteUrl(lang, "/aanbiedingen?sort=nieuw");

  const rows = deals
    .map((d) => {
      const { href } = productLink(d);
      const was = d.referencePrice
        ? `<span style="color:${MUTED};text-decoration:line-through;font-size:14px;">${fmt.euro(d.referencePrice)}</span> `
        : "";
      const img = d.imageUrl
        ? `<img src="${esc(d.imageUrl)}" alt="" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;border-radius:8px;background:#f4f4f5;">`
        : "";
      return `<tr><td style="padding:14px 0;border-bottom:1px solid #e4e4e7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="96" valign="top" style="padding-right:14px;"><a href="${esc(href)}">${img}</a></td>
<td valign="top">
<div style="font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:.5px;">${esc(d.shopName)}</div>
<a href="${esc(href)}" style="display:block;margin:2px 0 6px;color:${TEXT};text-decoration:none;font-size:16px;font-weight:bold;line-height:1.3;">${esc(d.name)}</a>
<div>${was}<span style="font-size:18px;font-weight:bold;">${fmt.euro(d.price)}</span>
<span style="display:inline-block;margin-left:6px;background:${BRAND};color:#ffffff;font-size:13px;font-weight:bold;padding:2px 7px;border-radius:5px;">-${Math.round(d.discountPercent)}%</span></div>
</td></tr></table>
</td></tr>`;
    })
    .join("\n");

  const siteLink = `<a href="${siteUrl(lang, "/")}" style="color:${MUTED};">Modelbouwkortingen.nl</a>`;
  const footer = `${esc(m.digestFooter).replace("{site}", siteLink)}<br><a href="${esc(unsubscribePage)}" style="color:${MUTED};">${esc(m.unsubscribe)}</a>`;

  return {
    to: email,
    subject: digestSubject(deals, lang),
    html: layout({
      lang,
      preheader: deals
        .slice(0, 3)
        .map((d) => d.name)
        .join(" · "),
      body: `<h1 style="margin:0 0 6px;font-size:22px;">${esc(m.digestHeading)}</h1>
<p style="margin:0 0 8px;font-size:15px;color:${MUTED};">${esc(m.digestIntro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:24px 0 0;text-align:center;">${button(allDeals, m.digestCta)}</p>`,
      footer,
    }),
    text: `${m.digestHeading}

${deals
  .map(
    (d) =>
      `${d.name} (${d.shopName})
${fmt.euro(d.price)}${d.referencePrice ? ` ${m.digestInsteadOf} ${fmt.euro(d.referencePrice)}` : ""}, -${Math.round(d.discountPercent)}%
${productLink(d).href}`,
  )
  .join("\n\n")}

${m.digestAllDeals}: ${allDeals}

${t(m.digestFooter, { site: "Modelbouwkortingen.nl" })}
${m.unsubscribe}: ${unsubscribePage}`,
    headers: {
      "List-Unsubscribe": `<${oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

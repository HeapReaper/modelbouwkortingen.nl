import { Phone } from "lucide-react";
import { SocialIcon } from "@/components/core/SocialIcon";
import { getI18n } from "@/i18n/server";
import { getPublicSiteContact, telHref } from "@/lib/site-contact";
import { SOCIAL_NAMES } from "@/lib/social-platforms";

/** Telefoonnummers in de rode balk (aan/uit in het adminpanel). */
export async function TopBarPhones() {
  const [{ dict }, { phones }] = await Promise.all([
    getI18n(),
    getPublicSiteContact(),
  ]);
  if (phones.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:ml-auto">
      {phones.map((p) => (
        <li key={p.id}>
          <a
            href={telHref(p.number)}
            aria-label={[dict.layout.call, p.label, p.number]
              .filter(Boolean)
              .join(" ")}
            className="inline-flex items-center gap-1.5 whitespace-nowrap hover:underline"
          >
            <Phone className="size-3.5" aria-hidden />
            {p.label ? <span className="opacity-80">{p.label}:</span> : null}
            <span className="tabular-nums">{p.number}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Social-mediapagina's in de footer (aan/uit in het adminpanel). */
export async function FooterSocials() {
  const [{ dict }, { socials }] = await Promise.all([
    getI18n(),
    getPublicSiteContact(),
  ]);
  if (socials.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold">{dict.footer.followUs}</h2>
      <ul className="flex flex-wrap gap-2">
        {socials.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={SOCIAL_NAMES[s.platform]}
              title={SOCIAL_NAMES[s.platform]}
              className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <SocialIcon platform={s.platform} className="size-5" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

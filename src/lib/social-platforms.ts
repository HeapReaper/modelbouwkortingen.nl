/** Social-mediaplatforms die in de footer kunnen staan (zie SocialLink in het schema). */
export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "hyves",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_NAMES: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  hyves: "Hyves",
};

export function isSocialPlatform(v: unknown): v is SocialPlatform {
  return SOCIAL_PLATFORMS.includes(v as SocialPlatform);
}

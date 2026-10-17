/**
 * Basic Auth voor /admin en /api/stats. Zet ADMIN_PASSWORD (en optioneel ADMIN_USER,
 * standaard "admin"). Zonder ADMIN_PASSWORD is het admin panel uitgeschakeld.
 * Voor scripts/monitoring kan ook "Authorization: Bearer <STATS_TOKEN>" gebruikt worden.
 */
export function adminEnabled() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAuthorized(
  authorization: string | null,
  opts?: { allowToken?: boolean },
) {
  if (!authorization) return false;
  const token = process.env.STATS_TOKEN;
  if (opts?.allowToken && token && authorization.startsWith("Bearer ")) {
    return safeEqual(authorization.slice(7), token);
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !authorization.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(authorization.slice(6));
  } catch {
    return false;
  }
  const i = decoded.indexOf(":");
  if (i < 0) return false;
  const user = process.env.ADMIN_USER || "admin";
  return (
    safeEqual(decoded.slice(0, i), user) &&
    safeEqual(decoded.slice(i + 1), password)
  );
}

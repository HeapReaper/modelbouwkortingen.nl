"use client";

import { useEffect } from "react";
import { OPT_OUT_KEY } from "@/components/analytics/PageViewTracker";

/** In het admin panel: eigen bezoeken van dit apparaat voortaan niet meer tellen. */
export function AnalyticsOptOut() {
  useEffect(() => {
    try {
      localStorage.setItem(OPT_OUT_KEY, "1");
    } catch {}
  }, []);
  return null;
}

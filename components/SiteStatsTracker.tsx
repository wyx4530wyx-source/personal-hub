"use client";

import { useEffect } from "react";

export type SiteStatsSnapshot = {
  likes: number;
  visits: number;
  online: number;
};

export const SITE_STATS_EVENT = "xhub:site-stats";
const VISITOR_ID_KEY = "xhub-visitor-id-v1";
const VISIT_COUNTED_KEY = "xhub-visit-counted-v1";

function createVisitorId() {
  const cryptoApi = typeof globalThis.crypto === "undefined" ? null : globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function visitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const created = createVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return createVisitorId();
  }
}

function publish(stats: SiteStatsSnapshot) {
  window.dispatchEvent(new CustomEvent<SiteStatsSnapshot>(SITE_STATS_EVENT, { detail: stats }));
}

export function SiteStatsTracker() {
  useEffect(() => {
    const id = visitorId();
    let stopped = false;

    const sendPresence = async (allowVisit: boolean) => {
      let countVisit = false;
      if (allowVisit) {
        try {
          countVisit = sessionStorage.getItem(VISIT_COUNTED_KEY) === null;
          if (countVisit) sessionStorage.setItem(VISIT_COUNTED_KEY, "pending");
        } catch { countVisit = false; }
      }

      try {
        const result = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "presence", visitorId: id, countVisit }),
          cache: "no-store",
        });
        if (!result.ok) throw new Error("统计签到失败");
        const stats = await result.json() as SiteStatsSnapshot;
        if (countVisit) {
          try { sessionStorage.setItem(VISIT_COUNTED_KEY, "counted"); } catch { /* no-op */ }
        }
        if (!stopped) publish(stats);
      } catch {
        if (countVisit) {
          try { sessionStorage.removeItem(VISIT_COUNTED_KEY); } catch { /* no-op */ }
        }
      }
    };

    void sendPresence(true);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") void sendPresence(false);
    }, 20_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void sendPresence(false);
    };
    const handlePageHide = () => {
      const payload = new Blob([JSON.stringify({ action: "leave", visitorId: id })], { type: "application/json" });
      navigator.sendBeacon("/api/stats", payload);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      stopped = true;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
}

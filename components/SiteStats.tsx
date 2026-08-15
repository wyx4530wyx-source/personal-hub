"use client";

import { useEffect, useRef, useState } from "react";
import { SITE_STATS_EVENT, type SiteStatsSnapshot } from "@/components/SiteStatsTracker";

const fallbackStats: SiteStatsSnapshot = { likes: 0, visits: 0, online: 1 };

function displayNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, value));
}

export function SiteStats() {
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<SiteStatsSnapshot>).detail;
      if (next) setStats({ ...next, online: Math.max(1, next.online) });
    };
    const refresh = async () => {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as SiteStatsSnapshot;
        setStats({ ...next, online: Math.max(1, next.online) });
      } catch { /* keep the visible fallback */ }
      finally { setLoading(false); }
    };
    window.addEventListener(SITE_STATS_EVENT, update);
    void refresh();
    const polling = window.setInterval(refresh, 20_000);
    return () => {
      window.removeEventListener(SITE_STATS_EVENT, update);
      window.clearInterval(polling);
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  const addLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const response = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
        cache: "no-store",
      });
      if (!response.ok) return;
      const next = await response.json() as SiteStatsSnapshot;
      setStats({ ...next, online: Math.max(1, next.online) });
      setFeedback(false);
      window.requestAnimationFrame(() => setFeedback(true));
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setFeedback(false), 700);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="site-stats-grid" aria-label="网站数据" data-page-loading={loading ? "true" : undefined}>
      <button className={`site-stat site-stat-like ${feedback ? "is-liked" : ""}`} type="button" onClick={addLike} disabled={liking} aria-label="给网站点赞">
        <strong>{displayNumber(stats.likes)}</strong>
        <span>累计获赞数</span>
        <em className="site-stat-feedback" aria-live="polite">{feedback ? "+1" : ""}</em>
      </button>
      <div className="site-stat">
        <strong>{displayNumber(stats.visits)}</strong>
        <span>累计访问次数</span>
      </div>
      <div className="site-stat">
        <strong>{displayNumber(Math.max(1, stats.online))}</strong>
        <span>当前在线人数</span>
      </div>
    </div>
  );
}

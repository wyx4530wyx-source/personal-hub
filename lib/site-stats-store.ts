import { env } from "cloudflare:workers";

export type SiteStats = {
  likes: number;
  visits: number;
  online: number;
};

const PRESENCE_TIMEOUT_MS = 55_000;
let schemaPromise: Promise<void> | null = null;

function database() {
  const runtime = env as unknown as { DB: D1Database };
  if (!runtime.DB) throw new Error("网站统计数据库尚未启动，请重新启动网站。");
  return runtime.DB;
}

async function initializeSchema() {
  const DB = database();
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY,
      likes INTEGER NOT NULL DEFAULT 0,
      visits INTEGER NOT NULL DEFAULT 0
    )`),
    DB.prepare("INSERT OR IGNORE INTO site_stats (id, likes, visits) VALUES (1, 0, 0)"),
    DB.prepare(`CREATE TABLE IF NOT EXISTS site_presence (
      visitor_id TEXT PRIMARY KEY,
      last_seen INTEGER NOT NULL
    )`),
    DB.prepare("CREATE INDEX IF NOT EXISTS idx_site_presence_last_seen ON site_presence(last_seen)"),
  ]);
  await DB.prepare("PRAGMA optimize").run();
}

export function ensureSiteStatsSchema() {
  if (!schemaPromise) {
    schemaPromise = initializeSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

async function readStats(now = Date.now()): Promise<SiteStats> {
  const DB = database();
  const cutoff = now - PRESENCE_TIMEOUT_MS;
  await DB.prepare("DELETE FROM site_presence WHERE last_seen < ?").bind(cutoff).run();
  const [totals, presence] = await Promise.all([
    DB.prepare("SELECT likes, visits FROM site_stats WHERE id = 1").first<{ likes: number; visits: number }>(),
    DB.prepare("SELECT COUNT(*) AS online FROM site_presence WHERE last_seen >= ?").bind(cutoff).first<{ online: number }>(),
  ]);
  return {
    likes: Number(totals?.likes || 0),
    visits: Number(totals?.visits || 0),
    online: Number(presence?.online || 0),
  };
}

export async function getSiteStats() {
  await ensureSiteStatsSchema();
  return readStats();
}

export async function incrementLikes() {
  await ensureSiteStatsSchema();
  const DB = database();
  await DB.prepare("UPDATE site_stats SET likes = likes + 1 WHERE id = 1").run();
  return readStats();
}

export async function recordPresence(visitorId: string, countVisit: boolean) {
  await ensureSiteStatsSchema();
  const DB = database();
  const now = Date.now();
  const statements = [
    DB.prepare(`INSERT INTO site_presence (visitor_id, last_seen) VALUES (?, ?)
      ON CONFLICT(visitor_id) DO UPDATE SET last_seen = excluded.last_seen`).bind(visitorId, now),
  ];
  if (countVisit) statements.push(DB.prepare("UPDATE site_stats SET visits = visits + 1 WHERE id = 1"));
  await DB.batch(statements);
  return readStats(now);
}

export async function removePresence(visitorId: string) {
  await ensureSiteStatsSchema();
  const DB = database();
  await DB.prepare("DELETE FROM site_presence WHERE visitor_id = ?").bind(visitorId).run();
  return readStats();
}

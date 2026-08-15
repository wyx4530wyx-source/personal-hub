import { env } from "cloudflare:workers";

const LOGIN_FAILURE_LIMIT = 5;
const LOGIN_WINDOW_SECONDS = 10 * 60;
const LOGIN_BLOCK_SECONDS = 15 * 60;

type LoginAttempt = {
  failures: number;
  windowStartedAt: number;
  blockedUntil: number;
};

export type AdminLoginLimit = {
  blocked: boolean;
  retryAfterSeconds: number;
};

function database() {
  const runtime = env as unknown as { DB?: D1Database };
  if (!runtime.DB) throw new Error("后台登录保护尚未连接数据库");
  return runtime.DB;
}

async function ensureLoginLimitSchema() {
  await database().prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
    client_key TEXT PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 0,
    window_started_at INTEGER NOT NULL,
    blocked_until INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`).run();
}

async function clientKey(request: Request) {
  const address = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "local";
  const input = new TextEncoder().encode(`xhub-admin-client:v1:${address}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  return Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
}

function blockedResult(blockedUntil: number, now: number): AdminLoginLimit {
  return {
    blocked: blockedUntil > now,
    retryAfterSeconds: Math.max(0, blockedUntil - now),
  };
}

export async function checkAdminLoginLimit(request: Request): Promise<AdminLoginLimit> {
  await ensureLoginLimitSchema();
  const key = await clientKey(request);
  const now = Math.floor(Date.now() / 1000);
  const attempt = await database().prepare(`SELECT
      failures,
      window_started_at AS windowStartedAt,
      blocked_until AS blockedUntil
    FROM admin_login_attempts WHERE client_key = ? LIMIT 1`)
    .bind(key)
    .first<LoginAttempt>();
  if (!attempt) return { blocked:false, retryAfterSeconds:0 };
  if (attempt.blockedUntil > now) return blockedResult(attempt.blockedUntil, now);
  if (attempt.windowStartedAt + LOGIN_WINDOW_SECONDS <= now) {
    await database().prepare("DELETE FROM admin_login_attempts WHERE client_key = ?").bind(key).run();
  }
  return { blocked:false, retryAfterSeconds:0 };
}

export async function recordAdminLoginFailure(request: Request): Promise<AdminLoginLimit> {
  await ensureLoginLimitSchema();
  const key = await clientKey(request);
  const now = Math.floor(Date.now() / 1000);
  const current = await database().prepare(`SELECT
      failures,
      window_started_at AS windowStartedAt,
      blocked_until AS blockedUntil
    FROM admin_login_attempts WHERE client_key = ? LIMIT 1`)
    .bind(key)
    .first<LoginAttempt>();
  if (current?.blockedUntil && current.blockedUntil > now) return blockedResult(current.blockedUntil, now);

  const withinWindow = Boolean(current && current.windowStartedAt + LOGIN_WINDOW_SECONDS > now);
  const failures = withinWindow ? current!.failures + 1 : 1;
  const windowStartedAt = withinWindow ? current!.windowStartedAt : now;
  const blockedUntil = failures >= LOGIN_FAILURE_LIMIT ? now + LOGIN_BLOCK_SECONDS : 0;
  await database().prepare(`INSERT INTO admin_login_attempts
      (client_key, failures, window_started_at, blocked_until, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(client_key) DO UPDATE SET
      failures = excluded.failures,
      window_started_at = excluded.window_started_at,
      blocked_until = excluded.blocked_until,
      updated_at = excluded.updated_at`)
    .bind(key, failures, windowStartedAt, blockedUntil, now)
    .run();
  return blockedResult(blockedUntil, now);
}

export async function clearAdminLoginFailures(request: Request) {
  await ensureLoginLimitSchema();
  const key = await clientKey(request);
  await database().prepare("DELETE FROM admin_login_attempts WHERE client_key = ?").bind(key).run();
}

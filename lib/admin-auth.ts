import { env } from "cloudflare:workers";

const COOKIE_NAME = "xhub_admin_session";
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

type AdminEnvironment = {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
};

function adminEnvironment() {
  const runtime = env as unknown as AdminEnvironment;
  if (!runtime.ADMIN_USERNAME || !runtime.ADMIN_PASSWORD_HASH || !runtime.ADMIN_SESSION_SECRET) {
    throw new Error("后台登录配置尚未设置");
  }
  return runtime as Required<AdminEnvironment>;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function hashPassword(password: string) {
  const input = new TextEncoder().encode(`xhub-admin:v1:${password}`);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", input)));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(adminEnvironment().ADMIN_SESSION_SECRET), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function readCookie(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === COOKIE_NAME) return value.join("=");
  }
  return null;
}

export async function verifyAdminCredentials(username: string, password: string) {
  const config = adminEnvironment();
  const passwordHash = await hashPassword(password);
  return safeEqual(username.trim(), config.ADMIN_USERNAME) && safeEqual(passwordHash, config.ADMIN_PASSWORD_HASH);
}

export async function createAdminSessionCookie() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `admin:${expiresAt}`;
  const token = `${toBase64Url(payload)}.${toBase64Url(await sign(payload))}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearAdminSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export async function isAdminRequest(request: Request) {
  try {
    const token = readCookie(request);
    if (!token) return false;
    const [encodedPayload, encodedSignature] = token.split(".");
    if (!encodedPayload || !encodedSignature) return false;
    const payload = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const [role, expiresAtText] = payload.split(":");
    if (role !== "admin" || Number(expiresAtText) <= Date.now()) return false;
    const actualSignature = bytesToHex(fromBase64Url(encodedSignature));
    const expectedSignature = bytesToHex(await sign(payload));
    return safeEqual(actualSignature, expectedSignature);
  } catch { return false; }
}

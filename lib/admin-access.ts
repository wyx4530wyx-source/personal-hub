export type HeaderReader = {
  get(name: string): string | null;
};

export function isPrivateHostname(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "::1") return true;
  let hostname = normalized;
  if (hostname.startsWith("[")) {
    const closingBracket = hostname.indexOf("]");
    hostname = closingBracket > 0 ? hostname.slice(1, closingBracket) : hostname;
  } else {
    hostname = hostname.split(":", 1)[0];
  }

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const numbers = parts.map(Number);
  if (numbers.some((part) => part < 0 || part > 255)) return false;
  return numbers[0] === 10
    || (numbers[0] === 172 && numbers[1] >= 16 && numbers[1] <= 31)
    || (numbers[0] === 192 && numbers[1] === 168);
}

export function isLocalAdminHeaders(headers: HeaderReader) {
  if (headers.get("cf-connecting-ip") || headers.get("cf-ray")) return false;
  const forwardedHost = headers.get("x-forwarded-host");
  if (forwardedHost && !isPrivateHostname(forwardedHost.split(",", 1)[0])) return false;
  return isPrivateHostname(headers.get("host") || "");
}

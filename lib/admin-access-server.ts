import { env } from "cloudflare:workers";
import { isLocalAdminHeaders, type HeaderReader } from "@/lib/admin-access";

export function isAdminAccessAllowed(headers: HeaderReader) {
  if (isLocalAdminHeaders(headers)) return true;
  const runtime = env as unknown as { ADMIN_PUBLIC_ENABLED?: string };
  return runtime.ADMIN_PUBLIC_ENABLED === "true";
}

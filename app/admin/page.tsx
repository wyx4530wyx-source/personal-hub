import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminGate } from "@/components/AdminGate";
import { isAdminAccessAllowed } from "@/lib/admin-access-server";

export const metadata: Metadata = { title: "内容管理" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminAccessAllowed(await headers())) notFound();
  return <AdminGate />;
}

import type { Metadata } from "next";
import { AdminPanel } from "@/components/AdminPanel";

export const metadata: Metadata = { title: "内容管理" };
export default function AdminPage() { return <AdminPanel />; }

import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { LiveDownloads } from "@/components/LiveContent";
export const metadata:Metadata = { title:"Downloads" };
export default function DownloadsPage() { return <div className="page-content"><PageHero index="03 / Downloads" title="Useful things" count="持续更新" description="Templates, notes, and small resources made to be used. Everything here is free to download and adapt." /><LiveDownloads /></div>; }

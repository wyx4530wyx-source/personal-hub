import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { LiveVideos } from "@/components/LiveContent";
export const metadata:Metadata = { title:"Videos" };
export default function VideosPage() { return <div className="page-content"><PageHero index="02 / Videos" title="Moving images" count="持续更新" description="Teaching videos, interesting videos, and animations. You’ll find them here." /><LiveVideos /></div>; }

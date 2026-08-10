import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { LiveVideos } from "@/components/LiveContent";
export const metadata:Metadata = { title:"Videos" };
export default function VideosPage() { return <div className="page-content"><PageHero index="02 / Videos" title="Moving images" count="持续更新" description="Short films, visual experiments, and quiet observations. Select any cover to play the video inline." /><LiveVideos /></div>; }

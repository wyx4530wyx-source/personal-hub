import type { Metadata } from "next";
import videos from "@/data/videos.json";
import { PageHero } from "@/components/PageHero";
import { VideoCard } from "@/components/VideoCard";
export const metadata:Metadata = { title:"Videos" };
export default function VideosPage() { return <div className="page-content"><PageHero index="02 / Videos" title="Moving images" count={`${videos.length} films`} description="Short films, visual experiments, and quiet observations. Select any cover to play the video inline." /><div className="video-grid">{videos.map((video,index) => <VideoCard key={video.id} video={video} index={index} />)}</div></div>; }

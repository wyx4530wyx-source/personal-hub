import Link from "next/link";
import posts from "@/data/posts.json";
import videos from "@/data/videos.json";
import downloads from "@/data/downloads.json";
import { Hero } from "@/components/Hero";
import { PostCard } from "@/components/PostCard";
import { VideoCard } from "@/components/VideoCard";
import { DownloadRow } from "@/components/DownloadRow";
import { Reveal } from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="content-section" id="latest">
        <Reveal><div className="section-heading"><p className="eyebrow">01 / Journal</p><h2>Latest Posts</h2><Link href="/posts" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <div className="post-grid">{posts.slice(0, 2).map((post, index) => <PostCard key={post.slug} post={post} index={index} />)}</div>
      </section>
      <section className="content-section">
        <Reveal><div className="section-heading"><p className="eyebrow">02 / Watch</p><h2>Latest Videos</h2><Link href="/videos" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <div className="video-grid compact-grid">{videos.slice(0, 2).map((video, index) => <VideoCard key={video.id} video={video} index={index} compact />)}</div>
      </section>
      <section className="content-section downloads-preview">
        <Reveal><div className="section-heading"><p className="eyebrow">03 / Collect</p><h2>Featured Downloads</h2><Link href="/downloads" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <div className="download-list">{downloads.slice(0, 3).map((item, index) => <DownloadRow key={item.id} item={item} index={index} />)}</div>
      </section>
    </>
  );
}

import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { LiveDownloads, LivePosts, LiveVideos } from "@/components/LiveContent";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="content-section" id="latest">
        <Reveal><div className="section-heading"><p className="eyebrow">01 / Journal</p><h2>Latest Posts</h2><Link href="/posts" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <LivePosts limit={2} />
      </section>
      <section className="content-section">
        <Reveal><div className="section-heading"><p className="eyebrow">02 / Watch</p><h2>Latest Videos</h2><Link href="/videos" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <LiveVideos limit={2} />
      </section>
      <section className="content-section downloads-preview">
        <Reveal><div className="section-heading"><p className="eyebrow">03 / Collect</p><h2>Featured Downloads</h2><Link href="/downloads" className="text-link">View all <span>↗</span></Link></div></Reveal>
        <LiveDownloads limit={3} />
      </section>
    </>
  );
}

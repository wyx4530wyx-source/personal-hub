import { Hero } from "@/components/Hero";
import { HomeScrollCover } from "@/components/HomeScrollCover";
import { Reveal } from "@/components/Reveal";
import { HomeRecentPosts, LiveDownloads, LivePosts, LiveVideos } from "@/components/LiveContent";
import { SiteStats } from "@/components/SiteStats";
import { HomeMusicPlayer } from "@/components/HomeMusicPlayer";
import { ProfileSocialLinks } from "@/components/ProfileSocialLinks";

export default function Home() {
  return (
    <HomeScrollCover hero={<Hero />}>
      <section className="content-section home-about-section" id="latest">
        <Reveal><div className="section-heading"><p className="eyebrow">01 / About</p><h2>关于本站</h2><a href="/about" className="text-link">View more <span>↗</span></a></div></Reveal>
        <div className="home-about-grid">
          <Reveal>
            <div className="home-about-card home-about-profile">
              <div className="home-about-identity">
                <div className="home-about-avatar"><img src="/images/profile-avatar.gif" alt="XING 的动态头像" /></div>
                <div className="home-about-person"><h3>满天翔</h3><ProfileSocialLinks /><p>这里是站长Vibecoding的个人博客，会分享帖子，有趣的视频和资源，喜欢可以点赞支持一下</p></div>
              </div>
              <div className="home-about-connect"><SiteStats /></div>
            </div>
          </Reveal>
          <Reveal delay={.08}>
            <div className="home-about-card home-about-copy">
              <h3 className="home-about-title"><span>ABOUT</span><small>关于小站的主人</small></h3>
              <p>小站的主人是高中牲，不喜欢去学校，喜欢有趣的东西，点这里跳转了解更多</p>
              <a href="/about" className="home-about-link">了解更多 <span>↗</span></a>
            </div>
          </Reveal>
          <Reveal delay={.12}>
            <HomeMusicPlayer />
          </Reveal>
          <Reveal delay={.16}>
            <div className="home-about-card home-about-recent">
              <div className="home-recent-heading"><div><p className="eyebrow">Recently published</p><h3>最近发布</h3></div><span>Latest</span></div>
              <HomeRecentPosts limit={3} />
            </div>
          </Reveal>
        </div>
      </section>
      <section className="content-section">
        <Reveal><div className="section-heading"><p className="eyebrow">02 / Journal</p><h2>帖子</h2><a href="/posts" className="text-link">View all <span>↗</span></a></div></Reveal>
        <LivePosts limit={2} />
      </section>
      <section className="content-section home-videos-section">
        <Reveal><div className="section-heading"><p className="eyebrow">03 / Watch</p><h2>视频</h2><a href="/videos" className="text-link">View all <span>↗</span></a></div></Reveal>
        <LiveVideos limit={2} />
      </section>
      <section className="content-section downloads-preview">
        <Reveal><div className="section-heading"><p className="eyebrow">04 / Collect</p><h2>资源</h2><a href="/downloads" className="text-link">View all <span>↗</span></a></div></Reveal>
        <LiveDownloads limit={3} />
      </section>
    </HomeScrollCover>
  );
}

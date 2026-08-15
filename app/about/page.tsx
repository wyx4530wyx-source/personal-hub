import type { Metadata } from "next";
import Image from "next/image";
import { ContactLinks } from "@/components/ContactLinks";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const skills = ["音乐", "绘画", "ACG", "GAME", "研究东西", "硬件数码"];

  return (
    <div className="page-content">
      <PageHero index="04 / About" title="个人空间" count="Based in Shanghai" description="HELLO WORLD，I'M XING" />
      <div className="about-grid">
        <Reveal><div className="about-portrait"><Image src="/images/architecture.jpg" alt="Abstract architectural portrait" width={800} height={1060} /></div></Reveal>
        <div className="about-copy">
          <Reveal><h2>关于我</h2><p>　　对AI大模型，VR，硬件，工具和网站感兴趣。平时喜欢上网或者说守墓！？对科学上网绕过限制和找资源有强烈执着。还喜欢看番，听音乐，视觉小说</p></Reveal>
          <Reveal delay={.08}><div className="info-block"><h3>HOBBY</h3><div className="tag-list">{skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></div></Reveal>
          <Reveal delay={.12}><div className="info-block"><h3>Selected work</h3><div><div className="project-item"><span>Personal Hub</span><span>Design & Development · 2026</span></div><div className="project-item"><span>City Frames</span><span>Photo Essay · 2026</span></div><div className="project-item"><span>Small Systems</span><span>Independent Research · 2025</span></div></div></div></Reveal>
          <Reveal delay={.16}><div className="info-block"><h3>Connect</h3><ContactLinks /></div></Reveal>
        </div>
      </div>
    </div>
  );
}

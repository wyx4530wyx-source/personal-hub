import type { Metadata } from "next";
import Image from "next/image";
import { ContactLinks } from "@/components/ContactLinks";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const skills = ["Creative coding", "Photography", "Video editing", "Writing", "Product design", "Research"];

  return (
    <div className="page-content">
      <PageHero index="04 / About" title="Curious by default" count="Based in Shanghai" description="I learn by making things, documenting the process, and following questions that refuse to stay in one discipline." />
      <div className="about-grid">
        <Reveal><div className="about-portrait"><Image src="/images/architecture.jpg" alt="Abstract architectural portrait" width={800} height={1060} /></div></Reveal>
        <div className="about-copy">
          <Reveal><h2>Hello, I’m Xing — a student and independent creator.</h2><p>I’m interested in the space between technology and culture: how tools change what we notice, how visual stories create atmosphere, and how small personal projects can become a way of thinking in public.</p></Reveal>
          <Reveal delay={.08}><div className="info-block"><h3>Skills</h3><div className="tag-list">{skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></div></Reveal>
          <Reveal delay={.12}><div className="info-block"><h3>Selected work</h3><div><div className="project-item"><span>Personal Hub</span><span>Design & Development · 2026</span></div><div className="project-item"><span>City Frames</span><span>Photo Essay · 2026</span></div><div className="project-item"><span>Small Systems</span><span>Independent Research · 2025</span></div></div></div></Reveal>
          <Reveal delay={.16}><div className="info-block"><h3>Connect</h3><ContactLinks /></div></Reveal>
        </div>
      </div>
    </div>
  );
}

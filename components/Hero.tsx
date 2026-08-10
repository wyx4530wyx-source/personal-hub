"use client";
import { motion } from "framer-motion";
export function Hero() {
  return (
    <section className="hero">
      <motion.p className="hero-index" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .65 }}>Independent creative / 2026</motion.p>
      <div className="hero-copy">
        <div style={{ overflow: "hidden" }}><motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>IBUKI</motion.h1></div>
        <div className="hero-subrow">
          <motion.p className="hero-intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .7 }}>Student. Creator.<br />Explorer.</motion.p>
          <motion.p className="hero-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .75 }}>A personal space for unfinished thoughts, small films, useful resources, and the work happening in between.</motion.p>
        </div>
      </div>
      <a className="round-link" href="#latest" aria-label="Explore latest content">↓</a>
    </section>
  );
}

"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function Hero() {
  const { scrollY } = useScroll();
  const copyY = useTransform(scrollY, (value) => -value);
  const [introReady, setIntroReady] = useState(false);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const waitingForInitialLoader = root.classList.contains("is-initial-loading");
    const waitingForPageReveal = root.classList.contains("is-page-transitioning");

    if (!waitingForInitialLoader && !waitingForPageReveal) {
      setIntroReady(true);
      return;
    }

    const startIntro = () => setIntroReady(true);
    const revealEvent = waitingForInitialLoader ? "xhub:initial-loader-complete" : "xhub:page-reveal-content";
    window.addEventListener(revealEvent, startIntro, { once: true });
    return () => window.removeEventListener(revealEvent, startIntro);
  }, []);

  useEffect(() => {
    const syncVideoPlayback = (position = scrollY.get()) => {
      const video = backgroundVideoRef.current;
      if (!video) return;
      const shouldPlay = !document.hidden && position <= window.innerHeight * 1.05;
      if (shouldPlay && video.paused) void video.play().catch(() => undefined);
      if (!shouldPlay && !video.paused) video.pause();
    };

    const stopWatchingScroll = scrollY.on("change", syncVideoPlayback);
    const handleVisibility = () => syncVideoPlayback();
    document.addEventListener("visibilitychange", handleVisibility);
    syncVideoPlayback();

    return () => {
      stopWatchingScroll();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [scrollY]);

  return (
    <section className="hero">
      <video ref={backgroundVideoRef} className="hero-background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}>
        <source src="/api/media?key=system%2Fwhale-fall-background.mp4" type="video/mp4" />
      </video>
      <motion.div className="hero-scroll-copy" style={{ y: copyY }}>
        <motion.p className="hero-index" initial={false} animate={{ opacity: introReady ? 1 : 0 }} transition={introReady ? { delay: .65 } : { duration: 0 }}>Independent creative / 2026</motion.p>
        <div className="hero-copy">
          <div style={{ overflow: "hidden" }}><motion.h1 initial={false} animate={{ y: introReady ? 0 : "105%" }} transition={introReady ? { duration: 1, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}>XING</motion.h1></div>
          <div className="hero-subrow">
            <motion.p className="hero-intro" initial={false} animate={{ opacity: introReady ? 1 : 0, y: introReady ? 0 : 24 }} transition={introReady ? { delay: .35, duration: .7 } : { duration: 0 }}>欢迎来到<br />满天翔的小站</motion.p>
            <motion.p className="hero-note" initial={false} animate={{ opacity: introReady ? 1 : 0 }} transition={introReady ? { delay: .75 } : { duration: 0 }}>这里是站长vebcoding的个人博客，会分享一些贴子，视频，资源。喜欢的话请看一看喵ᯠ _  ̫ _ ̥ ᯄ ੭</motion.p>
          </div>
        </div>
      </motion.div>
      <a className="round-link" href="#latest" aria-label="Explore latest content">↓</a>
    </section>
  );
}

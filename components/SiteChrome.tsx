"use client";

import { usePathname } from "next/navigation";
import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Live2DPio } from "@/components/Live2DPio";
import { PageTransition } from "@/components/PageTransition";
import { InitialLoader } from "@/components/InitialLoader";
import { SiteMusicProvider } from "@/components/SiteMusic";
import { SiteStatsTracker } from "@/components/SiteStatsTracker";
import { isPrivateHostname } from "@/lib/admin-access";

const links = [["Home", "/"], ["Posts", "/posts"], ["Videos", "/videos"], ["Downloads", "/downloads"], ["About", "/about"]];
const adminLink = ["管理内容", "/admin"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const cursorX = useSpring(-100, { stiffness: 560, damping: 42 });
  const cursorY = useSpring(-100, { stiffness: 560, damping: 42 });

  useEffect(() => {
    const move = (event: MouseEvent) => { cursorX.set(event.clientX); cursorY.set(event.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [cursorX, cursorY]);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => setHasMounted(true), []);
  useEffect(() => setShowAdminLink(isPrivateHostname(window.location.hostname)), []);

  return (
    <SiteMusicProvider>
      <SiteStatsTracker />
      <InitialLoader />
      <div className="noise" aria-hidden="true" />
      <motion.div className="cursor-dot" style={{ x: cursorX, y: cursorY }} aria-hidden="true" />
      <header className="site-header">
        <a href="/" className="brand" aria-label="XHUB home">
          <Image className="brand-logo" src="/images/xhub-logo.png" alt="XHUB" width={1171} height={422} priority />
        </a>
        <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
          {[...links, ...(showAdminLink ? [adminLink] : [])].map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <a key={href} href={href} className={active ? "active" : ""}>{label}</a>;
          })}
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle menu">{menuOpen ? "Close" : "Menu"}</button>
      </header>
      <motion.main key={pathname} className="page-shell" initial={hasMounted ? { opacity: 1, y: 38 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .82, delay: hasMounted ? .4 : 0, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.main>
      <PageTransition />
      <Live2DPio />
      <footer className="site-footer">
        <div className="footer-bottom"><span>© 2026 Xing</span><span>Shanghai · China</span><span>Built with curiosity</span><span className="live2d-credit">Live2D · live2d-widget · Pio</span></div>
      </footer>
    </SiteMusicProvider>
  );
}

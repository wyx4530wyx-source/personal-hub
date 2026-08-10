"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const links = [["Home", "/"], ["Posts", "/posts"], ["Videos", "/videos"], ["Downloads", "/downloads"], ["About", "/about"], ["管理内容", "/admin"]];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const cursorX = useSpring(-100, { stiffness: 560, damping: 42 });
  const cursorY = useSpring(-100, { stiffness: 560, damping: 42 });

  useEffect(() => {
    const move = (event: MouseEvent) => { cursorX.set(event.clientX); cursorY.set(event.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [cursorX, cursorY]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const openMobileApp = (event: React.MouseEvent<HTMLAnchorElement>, appName: string, scheme: string) => {
    event.preventDefault();
    const isMobile = window.matchMedia("(max-width: 800px)").matches || window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;
    const confirmed = window.confirm(`网站将尝试打开${appName}。\n\n只会打开 App，不会发送消息或执行其他操作。是否继续？`);
    if (confirmed) window.location.href = scheme;
  };

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <motion.div className="cursor-dot" style={{ x: cursorX, y: cursorY }} aria-hidden="true" />
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Ibuki home">IBUKI<span>Personal Hub</span></Link>
        <nav className={`nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
          {links.map(([label, href]) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? "active" : ""}>{label}</Link>;
          })}
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle menu">{menuOpen ? "Close" : "Menu"}</button>
      </header>
      <AnimatePresence mode="wait">
        <motion.main key={pathname} className="page-shell" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .48, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main>
      </AnimatePresence>
      <footer className="site-footer">
        <div className="footer-contacts">
          <a className="contact-row app-contact" href="weixin://" onClick={(event) => openMobileApp(event, "微信", "weixin://")}>
            <span>微信</span><strong>wyx4530wyx</strong>
          </a>
          <a className="contact-row app-contact" href="mqq://" onClick={(event) => openMobileApp(event, "QQ", "mqq://")}>
            <span>QQ</span><strong>3475231791</strong>
          </a>
          <div className="contact-row email-contact">
            <span>邮箱</span>
            <strong>
              <a href="mailto:wyx0424wyx@163.com">wyx0424wyx@163.com</a>
              <a href="mailto:wyx4530wyx@gmail.com">wyx4530wyx@gmail.com</a>
            </strong>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 Ibuki</span><span>Shanghai · China</span><span>Built with curiosity</span></div>
      </footer>
    </>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TransitionPhase = "idle" | "covering" | "covered" | "revealing";

const PAGE_LABELS: Record<string, string> = {
  "/": "HOME",
  "/posts": "POSTS",
  "/videos": "VIDEOS",
  "/downloads": "DOWNLOADS",
  "/about": "ABOUT",
  "/admin": "管理内容",
};

function pageLabel(pathname: string) {
  if (pathname.startsWith("/posts/")) return "POST";
  return PAGE_LABELS[pathname] || "XHUB";
}

function pause(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function nextPaint() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

export function PageTransition() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [label, setLabel] = useState("XHUB");
  const phaseRef = useRef<TransitionPhase>("idle");
  const destinationRef = useRef<string | null>(null);
  const outgoingRouteRef = useRef("");
  const outgoingPageRef = useRef<Element | null>(null);
  const navigationFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
    document.documentElement.classList.toggle("is-page-transitioning", phase !== "idle");
    return () => document.documentElement.classList.remove("is-page-transitioning");
  }, [phase]);

  useEffect(() => {
    const handleNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || !/^https?:$/.test(destination.protocol)) return;

      const currentRoute = `${window.location.pathname}${window.location.search}`;
      const nextRoute = `${destination.pathname}${destination.search}`;
      if (nextRoute === currentRoute) return;

      event.preventDefault();
      if (phaseRef.current !== "idle") return;

      const destinationPath = `${destination.pathname}${destination.search}${destination.hash}`;
      if (reduceMotion) {
        router.push(destinationPath);
        return;
      }

      destinationRef.current = destinationPath;
      outgoingRouteRef.current = currentRoute;
      outgoingPageRef.current = document.querySelector("main.page-shell");
      phaseRef.current = "covering";
      setLabel(pageLabel(destination.pathname));
      setPhase("covering");
    };

    document.addEventListener("click", handleNavigation, true);
    return () => document.removeEventListener("click", handleNavigation, true);
  }, [reduceMotion, router]);

  useEffect(() => {
    if (phase !== "covered" || !destinationRef.current) return;

    let cancelled = false;
    const destination = new URL(destinationRef.current, window.location.href);
    const expectedRoute = `${destination.pathname}${destination.search}`;
    const outgoingPathname = outgoingRouteRef.current.split("?")[0];
    const startedAt = Date.now();

    const waitUntilReady = async () => {
      let page: Element | null = null;
      while (!cancelled && Date.now() - startedAt < 12_000) {
        const currentRoute = `${window.location.pathname}${window.location.search}`;
        page = document.querySelector("main.page-shell");
        const routeChanged = currentRoute === expectedRoute;
        const pageChanged = outgoingPathname === destination.pathname || page !== outgoingPageRef.current;
        if (routeChanged && page && pageChanged) break;
        await pause(50);
      }
      if (cancelled || !page || `${window.location.pathname}${window.location.search}` !== expectedRoute) return;

      while (!cancelled && page.querySelector('[data-page-loading="true"]') && Date.now() - startedAt < 12_000) {
        await pause(50);
      }

      const imageDeadline = Math.min(startedAt + 12_000, Date.now() + 6_000);
      while (!cancelled && Date.now() < imageDeadline) {
        const visibleImages = Array.from(page.querySelectorAll("img")).filter((image) => {
          const bounds = image.getBoundingClientRect();
          return bounds.top < window.innerHeight * 1.25 && bounds.bottom > 0;
        });
        if (visibleImages.every((image) => image.complete)) break;
        await pause(50);
      }

      if (document.fonts) await Promise.race([document.fonts.ready.catch(() => undefined), pause(1_200)]);
      await nextPaint();
      await nextPaint();
      if (cancelled) return;

      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
      phaseRef.current = "revealing";
      setPhase("revealing");
    };

    void waitUntilReady();
    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "revealing") return;

    const contentRevealTimer = window.setTimeout(() => {
      window.dispatchEvent(new Event("xhub:page-reveal-content"));
    }, 400);

    return () => clearTimeout(contentRevealTimer);
  }, [phase]);

  useEffect(() => () => {
    if (navigationFallbackRef.current) clearTimeout(navigationFallbackRef.current);
    document.documentElement.classList.remove("is-page-transitioning");
  }, []);

  const handleAnimationComplete = () => {
    if (phase === "covering") {
      phaseRef.current = "covered";
      setPhase("covered");
      const destination = destinationRef.current;
      if (!destination) return;

      router.push(destination);
      navigationFallbackRef.current = setTimeout(() => {
        if (phaseRef.current === "covered") window.location.assign(destination);
      }, 15000);
      return;
    }

    if (phase === "revealing") {
      if (navigationFallbackRef.current) clearTimeout(navigationFallbackRef.current);
      navigationFallbackRef.current = null;
      destinationRef.current = null;
      phaseRef.current = "idle";
      setPhase("idle");
    }
  };

  const y = phase === "idle" ? "115%" : phase === "revealing" ? "-115%" : "0%";
  const transition = phase === "covering"
    ? { duration: 0.52, ease: [0.76, 0, 0.24, 1] as const }
    : phase === "revealing"
      ? { duration: 0.82, ease: [0.76, 0, 0.24, 1] as const }
      : { duration: 0 };

  return (
    <div className={`page-transition${phase !== "idle" ? " is-active" : ""}`} role="status" aria-live="polite" aria-label={phase === "idle" ? undefined : `正在进入 ${label}`}>
      <motion.div
        className="page-transition-screen"
        initial={{ y: "115%" }}
        animate={{ y }}
        transition={transition}
        onAnimationComplete={handleAnimationComplete}
      >
        <div className="page-transition-curve page-transition-curve-top" aria-hidden="true" />
        <div className="page-transition-word" aria-hidden="true">
          <span className="page-transition-dot" />
          <motion.span key={label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.16 }}>{label}</motion.span>
        </div>
        <div className="page-transition-curve page-transition-curve-bottom" aria-hidden="true" />
      </motion.div>
    </div>
  );
}

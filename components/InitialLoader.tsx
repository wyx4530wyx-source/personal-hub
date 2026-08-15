"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { INITIAL_LOADER_SEEN_KEY } from "@/lib/initial-loader";

type LoaderState = "checking" | "visible" | "exiting" | "hidden";

const MINIMUM_DISPLAY_TIME = 1500;
const MAXIMUM_WAIT_TIME = 6000;

function waitForWindowLoad() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
}

function waitForHeroVideo() {
  const video = document.querySelector<HTMLVideoElement>(".hero-background-video");
  if (!video || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => resolve();
    video.addEventListener("loadeddata", finish, { once: true });
    video.addEventListener("error", finish, { once: true });
  });
}

export function InitialLoader() {
  const [state, setState] = useState<LoaderState>("checking");

  useEffect(() => {
    let active = true;
    let finishing = false;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      if (sessionStorage.getItem(INITIAL_LOADER_SEEN_KEY)) {
        document.documentElement.classList.add("initial-loader-seen");
        setState("hidden");
        return;
      }
    } catch {
      // If browser storage is unavailable, the loader still works for this visit.
    }

    const startedAt = performance.now();
    document.documentElement.classList.add("is-initial-loading");
    setState("visible");

    const finish = () => {
      if (!active || finishing) return;
      finishing = true;
      const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - (performance.now() - startedAt));
      exitTimer = setTimeout(() => {
        if (!active) return;
        setState("exiting");
        exitTimer = setTimeout(() => {
          if (!active) return;
          try { sessionStorage.setItem(INITIAL_LOADER_SEEN_KEY, "true"); } catch { /* no-op */ }
          document.documentElement.classList.remove("is-initial-loading");
          document.documentElement.classList.add("initial-loader-seen");
          setState("hidden");
          window.dispatchEvent(new Event("xhub:initial-loader-complete"));
        }, 720);
      }, remaining);
    };

    const readiness = Promise.all([
      waitForWindowLoad(),
      waitForHeroVideo(),
      document.fonts?.ready ?? Promise.resolve(),
    ]);

    readiness.then(finish);
    safetyTimer = setTimeout(finish, MAXIMUM_WAIT_TIME);

    return () => {
      active = false;
      if (exitTimer) clearTimeout(exitTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      document.documentElement.classList.remove("is-initial-loading");
    };
  }, []);

  if (state === "hidden") return null;

  return (
    <div className={`initial-loader${state === "exiting" ? " is-exiting" : ""}`} role="status" aria-live="polite" aria-label="Loading website">
      <div className="initial-loader-content">
        <div className="initial-loader-mark" aria-hidden="true">
          <Image
            className="initial-loader-script"
            src="/images/loading-script.jpg"
            alt=""
            width={1920}
            height={640}
            priority
          />
          <span className="initial-loader-windmill-anchor">
            <Image
              className="initial-loader-windmill"
              src="/images/loading-windmill.png"
              alt=""
              width={268}
              height={249}
              priority
            />
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BubbleMessage = {
  text?: string;
  prefix?: string;
  accent?: string;
};

type PioModel = {
  init: (canvasId: string, modelPath: string, modelSettings: object) => Promise<void>;
  destroy: () => void;
};

type SafePioModel = PioModel & {
  live2DMgr?: { model?: unknown };
  followPointer?: (event: MouseEvent | Touch) => void;
  modelTurnHead?: (event: MouseEvent | Touch) => void;
};

declare global {
  interface Window {
    Live2D?: unknown;
  }
}

const CLICK_MESSAGES = [
  "我可爱吗？",
  "不要摸我，再摸会长不高的",
  "110吗，这里有人一直摸我(⋟﹏⋞)",
];

const IDLE_MESSAGES = [
  "今天天气真好，和你一样好",
  "悄悄告诉你，其实站长……(这里站长没想好)",
  "你能常来看看我吗？",
];

const WELCOME_MESSAGE: BubbleMessage = {
  prefix: "欢迎来到",
  accent: "满天翔的小站",
};

const WELCOME_SHOWN_KEY = "pio-welcome-shown";

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function guardPointerEventsUntilLoaded(model: SafePioModel) {
  const followPointer = model.followPointer?.bind(model);
  const modelTurnHead = model.modelTurnHead?.bind(model);

  if (followPointer) {
    model.followPointer = (event) => {
      if (!model.live2DMgr?.model) return;
      followPointer(event);
    };
  }

  if (modelTurnHead) {
    model.modelTurnHead = (event) => {
      if (!model.live2DMgr?.model) return;
      modelTurnHead(event);
    };
  }
}

function loadCubism2Core() {
  if (window.Live2D) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-pio-cubism-core]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Live2D core failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/live2d/live2d.min.js";
    script.async = true;
    script.dataset.pioCubismCore = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Live2D core failed to load"));
    document.head.appendChild(script);
  });
}

export function Live2DPio() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickUntilRef = useRef(0);
  const [message, setMessage] = useState<BubbleMessage | null>(null);
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  const showMessage = useCallback((nextMessage: BubbleMessage, duration = 4600) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setMessage(nextMessage);
    messageTimerRef.current = setTimeout(() => setMessage(null), duration);
  }, []);

  useEffect(() => {
    let active = true;
    let model: PioModel | null = null;

    async function startModel() {
      try {
        await loadCubism2Core();
        const [{ default: Cubism2Model }, response] = await Promise.all([
          import("live2d-widgets/build/cubism2/index.js"),
          fetch("/live2d/pio/index.json"),
        ]);
        if (!response.ok) throw new Error("Pio model settings failed to load");
        const settings = await response.json() as object;
        if (!active) return;

        model = new Cubism2Model() as SafePioModel;
        guardPointerEventsUntilLoaded(model);
        await model.init("live2d", "/live2d/pio/index.json", settings);
        if (!active) {
          model.destroy();
          return;
        }
        setReady(true);
        if (!sessionStorage.getItem(WELCOME_SHOWN_KEY)) {
          sessionStorage.setItem(WELCOME_SHOWN_KEY, "true");
          showMessage(WELCOME_MESSAGE, 7600);
        }
      } catch (error) {
        console.error("Pio Live2D could not start", error);
      }
    }

    void startModel();
    return () => {
      active = false;
      model?.destroy();
    };
  }, [showMessage]);

  useEffect(() => {
    if (!ready || hidden) return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const delay = 24000 + Math.random() * 12000;
      idleTimer = setTimeout(() => {
        showMessage({ text: randomItem(IDLE_MESSAGES) }, 5000);
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [hidden, ready, showMessage]);

  useEffect(() => {
    const widget = widgetRef.current;
    const canvas = canvasRef.current;
    if (!widget || !canvas) return;

    let dragging = false;
    let moved = false;
    let pointerId = -1;
    let offsetX = 0;
    let offsetY = 0;

    const desktopMode = () => window.matchMedia("(min-width: 801px)").matches;

    const onPointerDown = (event: PointerEvent) => {
      if (!desktopMode() || event.button !== 0) return;
      const rect = widget.getBoundingClientRect();
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      canvas.setPointerCapture?.(event.pointerId);
      widget.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      moved = true;
      const maxLeft = Math.max(0, window.innerWidth - widget.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - widget.offsetHeight);
      const left = Math.min(maxLeft, Math.max(0, event.clientX - offsetX));
      const top = Math.min(maxTop, Math.max(0, event.clientY - offsetY));
      widget.style.left = `${left}px`;
      widget.style.top = `${top}px`;
      widget.style.bottom = "auto";
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      widget.classList.remove("is-dragging");
      if (moved) suppressClickUntilRef.current = Date.now() + 300;
      canvas.releasePointerCapture?.(event.pointerId);
    };

    const onCharacterClick = () => {
      if (Date.now() < suppressClickUntilRef.current) return;
      showMessage({ text: randomItem(CLICK_MESSAGES) });
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("click", onCharacterClick);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("click", onCharacterClick);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [showMessage]);

  useEffect(() => () => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const closePio = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    showMessage({ text: "不要我了吗" }, 1900);
    closeTimerRef.current = setTimeout(() => setHidden(true), 1700);
  };

  const reopenPio = () => {
    setHidden(false);
  };

  return (
    <>
      <div
        id="pio-waifu"
        ref={widgetRef}
        className={`pio-waifu${ready ? " is-ready" : ""}${hidden ? " is-hidden" : ""}`}
        aria-label="Pio Live2D 看板娘"
      >
        <div className={`pio-bubble${message ? " is-visible" : ""}`} aria-live="polite">
          {message?.prefix}
          {message?.accent && <span>{message.accent}</span>}
          {message?.text}
        </div>
        <button className="pio-close" type="button" onClick={closePio} aria-label="隐藏看板娘">×</button>
        <canvas ref={canvasRef} id="live2d" width="600" height="720" aria-label="Pio 动画模型" />
      </div>
      <button
        className={`pio-reopen${hidden ? " is-visible" : ""}`}
        type="button"
        onClick={reopenPio}
        aria-label="重新显示看板娘"
      >
        Pio
      </button>
    </>
  );
}

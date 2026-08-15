"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AdminPanel } from "@/components/AdminPanel";

type AuthState = "checking" | "signed-out" | "signed-in";
type AuthTransition = "idle" | "covering" | "covered" | "revealing";

export function AdminGate() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [transitionPhase, setTransitionPhase] = useState<AuthTransition>("idle");

  useEffect(() => {
    fetch("/api/admin-auth", { cache:"no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?:boolean }) => setAuthState(result.authenticated ? "signed-in" : "signed-out"))
      .catch(() => setAuthState("signed-out"));
  }, []);

  useEffect(() => {
    if (transitionPhase === "idle") return;
    document.documentElement.classList.add("is-page-transitioning");
    return () => document.documentElement.classList.remove("is-page-transitioning");
  }, [transitionPhase]);

  useEffect(() => {
    if (transitionPhase !== "covered") return;
    setAuthState("signed-in");
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => {
      root.style.scrollBehavior = previousScrollBehavior;
      setTransitionPhase("revealing");
    }, 90);
    return () => {
      window.clearTimeout(timer);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [transitionPhase]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin-auth", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({ username:form.get("username"), password:form.get("password") }),
      });
      const result = await response.json() as { authenticated?:boolean; error?:string };
      if (!response.ok || !result.authenticated) throw new Error(result.error || "登录失败");
      setTransitionPhase("covering");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请重试");
    } finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin-auth", { method:"DELETE" }).catch(() => undefined);
    setAuthState("signed-out");
    setMessage("");
  }

  const transitionY = transitionPhase === "idle" ? "115%" : transitionPhase === "revealing" ? "-115%" : "0%";
  const transition = transitionPhase === "covering"
    ? { duration:0.52, ease:[0.76, 0, 0.24, 1] as const }
    : transitionPhase === "revealing"
      ? { duration:0.82, ease:[0.76, 0, 0.24, 1] as const }
      : { duration:0 };

  const curtain = <div className={`page-transition admin-auth-transition${transitionPhase !== "idle" ? " is-active" : ""}`} role="status" aria-live="polite" aria-label={transitionPhase === "idle" ? undefined : "正在进入内容管理"}>
    <motion.div className="page-transition-screen" initial={{ y:"115%" }} animate={{ y:transitionY }} transition={transition} onAnimationComplete={() => {
      if (transitionPhase === "covering") setTransitionPhase("covered");
      else if (transitionPhase === "revealing") setTransitionPhase("idle");
    }}>
      <div className="page-transition-curve page-transition-curve-top" aria-hidden="true" />
      <div className="page-transition-word" aria-hidden="true"><span className="page-transition-dot" /><motion.span initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:.38, delay:.16 }}>内容管理</motion.span></div>
      <div className="page-transition-curve page-transition-curve-bottom" aria-hidden="true" />
    </motion.div>
  </div>;

  if (authState === "signed-in") return <><AdminPanel onLogout={logout} />{curtain}</>;

  return <><main className="admin-login-page">
    <section className="admin-login-card" aria-busy={authState === "checking"}>
      <span className="admin-login-kicker">XHUB · PRIVATE</span>
      <h1>{authState === "checking" ? "正在验证" : "内容管理"}</h1>
      {authState === "checking" ? <p className="admin-login-checking">正在确认登录状态……</p> : <>
        <p>请输入管理员账号和密码，验证成功后才能进入发布后台。</p>
        <form onSubmit={login} className="admin-login-form">
          <label><span>用户名</span><input name="username" type="text" autoComplete="username" required autoFocus /></label>
          <label><span>密码</span><input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit" disabled={busy}>{busy ? "正在验证……" : "登录"}</button>
          {message && <p className="admin-login-error" role="alert">{message}</p>}
        </form>
      </>}
    </section>
  </main>{curtain}</>;
}

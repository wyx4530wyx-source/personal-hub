"use client";

import type { MouseEvent } from "react";

export function ContactLinks() {
  const openMobileApp = (event: MouseEvent<HTMLAnchorElement>, appName: string, scheme: string) => {
    event.preventDefault();
    const isMobile = window.matchMedia("(max-width: 800px)").matches || window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;
    if (window.confirm(`网站将尝试打开${appName}。\n\n是否继续？`)) window.location.href = scheme;
  };

  return (
    <div className="connect-list">
      <a className="connect-item connect-app" href="weixin://" onClick={(event) => openMobileApp(event, "微信", "weixin://")}>
        <span>微信</span><strong>wyx4530wyx</strong>
      </a>
      <a className="connect-item connect-app" href="mqq://" onClick={(event) => openMobileApp(event, "QQ", "mqq://")}>
        <span>QQ</span><strong>3475231791</strong>
      </a>
      <div className="connect-item connect-email">
        <span>邮箱</span>
        <strong>
          <a href="mailto:wyx0424wyx@163.com">wyx0424wyx@163.com</a>
          <a href="mailto:wyx4530wyx@gmail.com">wyx4530wyx@gmail.com</a>
        </strong>
      </div>
    </div>
  );
}

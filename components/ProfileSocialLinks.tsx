"use client";

import type { MouseEvent } from "react";

const externalLinks = [
  { label: "哔哩哔哩", icon: "/icons/bilibili.svg", href: "https://space.bilibili.com/3546935919118964?spm_id_from=333.1007.0.0" },
  { label: "GitHub", icon: "/icons/github.svg", href: "https://github.com/wyx4530wyx-source" },
  { label: "邮箱", icon: "/icons/mail.svg", href: "mailto:wyx4530wyx@gmail.com" },
];

export function ProfileSocialLinks() {
  const openMobileApp = (event: MouseEvent<HTMLAnchorElement>, appName: string, scheme: string) => {
    event.preventDefault();
    const isMobile = window.matchMedia("(max-width: 800px)").matches || window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;
    if (window.confirm(`网站将尝试打开${appName}。\n\n是否继续？`)) window.location.href = scheme;
  };

  return (
    <div className="profile-social-links" aria-label="社交联系方式">
      <a href="weixin://" onClick={(event) => openMobileApp(event, "微信", "weixin://")} aria-label="打开微信" title="微信">
        <img src="/icons/wechat.svg" alt="" />
      </a>
      <a href="mqq://" onClick={(event) => openMobileApp(event, "QQ", "mqq://")} aria-label="打开 QQ" title="QQ">
        <img src="/icons/qq.svg" alt="" />
      </a>
      {externalLinks.map((item) => (
        <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined} aria-label={item.label} title={item.label}>
          <img src={item.icon} alt="" />
        </a>
      ))}
    </div>
  );
}

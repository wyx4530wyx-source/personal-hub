import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Home scroll-cover structure", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /class="home-scroll-cover"/);
  assert.match(html, /class="home-hero-stage"/);
  assert.match(html, /class="home-content-panel"/);
  assert.match(html, />XING</);
  assert.match(html, /Independent creative \/ 2026/);
  assert.match(html, /<video[^>]*class="hero-background-video"[^>]*autoPlay=""[^>]*muted=""[^>]*loop=""[^>]*playsInline=""/);
  assert.match(html, /\/api\/media\?key=system%2Fwhale-fall-background\.mp4/);
  assert.match(html, /欢迎来到/);
  assert.match(html, /满天翔的小站/);
  assert.match(html, /这里是站长vebcoding的个人博客，会分享一些贴子，视频，资源。喜欢的话请看一看喵ᯠ _  ̫ _ ̥ ᯄ ੭/);
  assert.match(html, />帖子</);
  assert.match(html, />视频</);
  assert.match(html, />资源</);
});

test("adds a functional glass About section before the Home content previews", async () => {
  const [home, liveContent, player, music, social, chrome, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveContent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HomeMusicPlayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteMusic.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ProfileSocialLinks.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(home, /01 \/ About/);
  assert.match(home, /02 \/ Journal/);
  assert.match(home, /03 \/ Watch/);
  assert.match(home, /04 \/ Collect/);
  assert.match(home, /<h2>关于本站<\/h2>/);
  assert.match(home, /href="\/about"/);
  assert.match(home, /<SiteStats \/>/);
  assert.doesNotMatch(home, /<ContactLinks \/>/);
  assert.match(home, /\/images\/profile-avatar\.gif/);
  assert.match(home, /<ProfileSocialLinks \/>/);
  assert.match(home, /<h3>满天翔<\/h3>/);
  assert.match(home, /<h3 className="home-about-title"><span>ABOUT<\/span><small>关于小站的主人<\/small><\/h3>/);
  assert.match(social, /\/icons\/wechat\.svg/);
  assert.match(social, /\/icons\/qq\.svg/);
  assert.match(social, /\/icons\/bilibili\.svg/);
  assert.match(social, /\/icons\/github\.svg/);
  assert.match(social, /\/icons\/mail\.svg/);
  assert.match(social, /3546935919118964/);
  assert.match(social, /wyx4530wyx-source/);
  assert.match(social, /mailto:wyx4530wyx@gmail\.com/);
  assert.match(home, /home-about-recent/);
  assert.match(home, /<HomeRecentPosts limit=\{3\} \/>/);
  assert.match(liveContent, /fetch\(`\/api\/content\?type=\$\{type\}`\)/);
  assert.match(liveContent, /href=\{`\/posts\/\$\{post\.slug\}`\}/);
  assert.match(home, /<HomeMusicPlayer \/>/);
  assert.match(music, /\/audio\/unicorn\.mp3/);
  assert.match(music, /\/audio\/at-the-mountain-behind\.mp3/);
  assert.match(music, /\/audio\/bloom-of-youth\.mp3/);
  assert.match(music, /\/audio\/anohana-violin\.mp3/);
  assert.match(music, /\/audio\/natsukage\.mp3/);
  assert.match(music, /\/audio\/science-feat-kasane-teto\.mp3/);
  assert.match(player, /type="range"/);
  assert.match(music, /audio\.play\(\)/);
  assert.match(player, /chooseTrack\(trackIndex - 1\)/);
  assert.match(player, /chooseTrack\(trackIndex \+ 1\)/);
  assert.match(player, /aria-label="关闭播放列表"/);
  assert.match(player, /setPlaylistOpen\(false\)/);
  assert.match(chrome, /<SiteMusicProvider>/);
  assert.match(chrome, /<motion\.main key=\{pathname\}/);
  assert.match(chrome, /initial=\{hasMounted \? \{ opacity: 1, y: 38 \} : false\}/);
  assert.match(music, /className="site-music-audio"/);
  assert.match(css, /\.home-about-grid \{[^}]*grid-template-columns:minmax\(0,39fr\) minmax\(0,22fr\) minmax\(0,39fr\);[^}]*grid-template-rows:minmax\(0,6fr\) minmax\(0,5fr\);[^}]*height:820px;/s);
  assert.match(css, /\.home-about-card \{[^}]*backdrop-filter:none;[^}]*-webkit-backdrop-filter:none;/s);
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\) \{\s*\.home-about-card:hover \{[^}]*transform:translateY\(-8px\);/s);
  assert.match(css, /\.home-about-grid>div:nth-child\(1\) \{ grid-column:1\/3; margin-right:12px; \}/);
  assert.match(css, /\.home-about-grid>div:nth-child\(2\) \{ grid-column:3\/4; margin-left:12px; \}/);
  assert.match(css, /\.home-about-grid>div:nth-child\(3\) \{ grid-column:1\/2; margin-right:12px; \}/);
  assert.match(css, /\.home-about-grid>div:nth-child\(4\) \{ grid-column:2\/4; margin-left:12px; \}/);
});

test("manages uploaded music in the cloud while preserving the built-in playlist", async () => {
  const [admin, route, store, music, player, css] = await Promise.all([
    readFile(new URL("../components/AdminPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/content/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteMusic.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HomeMusicPlayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(store, /"post" \| "video" \| "download" \| "music"/);
  assert.match(route, /\["post", "video", "download", "music"\]/);
  assert.match(route, /type === "music"\) && !file/);
  assert.match(route, /file\.type\.startsWith\("audio\/"\)/);
  assert.match(admin, /music: "上传音乐"/);
  assert.match(admin, /歌手 \/ 作者/);
  assert.match(admin, /accept="audio\/\*/);
  assert.match(admin, /xhub:music-library-changed/);
  assert.match(music, /fetch\("\/api\/content\?type=music"/);
  assert.match(music, /setTracks\(\[\.\.\.siteTracks, \.\.\.uploaded\]\)/);
  assert.match(music, /window\.addEventListener\("xhub:music-library-changed"/);
  assert.match(player, /tracks\.map\(\(item, index\)/);
  assert.match(css, /\.admin-tabs \{[^}]*grid-template-columns:repeat\(4,1fr\);/s);
});

test("persists likes and visits while tracking current online visitors", async () => {
  const [home, stats, tracker, route, store, schema, chrome, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteStats.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteStatsTracker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stats/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-stats-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(home, /<SiteStats \/>/);
  assert.match(stats, /累计获赞数/);
  assert.match(stats, /累计访问次数/);
  assert.match(stats, /当前在线人数/);
  assert.match(stats, /action: "like"/);
  assert.match(stats, /site-stat-feedback/);
  assert.match(tracker, /sessionStorage\.getItem\(VISIT_COUNTED_KEY\)/);
  assert.match(tracker, /window\.setInterval/);
  assert.match(tracker, /navigator\.sendBeacon/);
  assert.match(tracker, /action: "presence"/);
  assert.match(route, /incrementLikes/);
  assert.match(route, /recordPresence/);
  assert.match(store, /UPDATE site_stats SET likes = likes \+ 1/);
  assert.match(store, /UPDATE site_stats SET visits = visits \+ 1/);
  assert.match(store, /PRESENCE_TIMEOUT_MS/);
  assert.match(schema, /site_stats/);
  assert.match(schema, /site_presence/);
  assert.match(chrome, /<SiteStatsTracker \/>/);
  assert.match(css, /\.site-stats-grid \{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\);/s);
  assert.match(css, /@keyframes site-stat-feedback/);
});

test("publishes interleaved text and image blocks while keeping old posts compatible", async () => {
  const [admin, route, store, article, schema, migration, css] = await Promise.all([
    readFile(new URL("../components/AdminPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/content/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0002_melted_nekra.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(admin, /<h1>内容管理<\/h1>/);
  assert.match(admin, /添加文字/);
  assert.match(admin, /添加图片/);
  assert.match(admin, /moveBlock/);
  assert.match(admin, /contentBlocks/);
  assert.match(route, /form\.get\(block\.field\)/);
  assert.match(route, /JSON\.stringify\(contentBlocks\)/);
  assert.match(route, /MAX_FILE_SIZE = 50 \* 1024 \* 1024/);
  assert.match(route, /MAX_IMAGE_SIZE = 25 \* 1024 \* 1024/);
  assert.match(admin, /单个视频不超过 50 MB/);
  assert.match(admin, /单个文件不超过 50 MB/);
  assert.match(route, /一篇帖子最多添加 20 张正文图片/);
  assert.match(store, /content_blocks AS contentBlocks/);
  assert.match(store, /ALTER TABLE content_items ADD COLUMN content_blocks/);
  assert.match(article, /display\.contentBlocks\.length/);
  assert.match(article, /<MarkdownBody key=\{`text-\$\{index\}`\}/);
  assert.match(article, /className="article-block-image"/);
  assert.match(article, /: <><MarkdownBody content=\{display\.content\}/);
  assert.match(schema, /contentBlocks: text\("content_blocks"\)/);
  assert.match(migration, /ADD `content_blocks`/);
  assert.match(css, /\.article-block-image \{[^}]*width:100%;[^}]*margin:80px 0;/s);
  assert.match(css, /@media \(max-width:800px\) \{[\s\S]*\.article-block-image \{[^}]*width:100vw;[^}]*transform:translateX\(-50%\);/s);
  assert.match(css, /\.article-block-image img \{[^}]*width:100%;[^}]*height:auto;/s);
});

test("gates content management behind a signed server-controlled admin session", async () => {
  const [page, gate, authRoute, auth, loginLimit, access, contentRoute, panel, chrome, css] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/AdminGate.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin-auth/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-login-limit.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/admin-access.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/content/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/AdminPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /<AdminGate \/>/);
  assert.match(page, /isAdminAccessAllowed\(await headers\(\)\)/);
  assert.match(gate, /type="password"/);
  assert.match(gate, /fetch\("\/api\/admin-auth"/);
  assert.match(gate, /authState === "signed-in"/);
  assert.match(gate, /<AdminPanel onLogout=\{logout\} \/>/);
  assert.match(gate, /setTransitionPhase\("covering"\)/);
  assert.match(gate, /transitionPhase !== "covered"/);
  assert.match(gate, /setAuthState\("signed-in"\)/);
  assert.match(gate, /page-transition-curve page-transition-curve-top/);
  assert.match(gate, /transitionPhase === "revealing"/);
  assert.match(authRoute, /verifyAdminCredentials/);
  assert.match(authRoute, /checkAdminLoginLimit/);
  assert.match(authRoute, /recordAdminLoginFailure/);
  assert.match(authRoute, /status:429/);
  assert.match(authRoute, /Retry-After/);
  assert.match(authRoute, /Set-Cookie/);
  assert.match(auth, /HttpOnly; SameSite=Strict/);
  assert.match(auth, /crypto\.subtle\.sign\("HMAC"/);
  assert.match(auth, /ADMIN_PASSWORD_HASH/);
  assert.doesNotMatch(auth, /const ADMIN_PASSWORD\s*=/);
  assert.doesNotMatch(auth, /const ADMIN_PASSWORD_HASH\s*=/);
  assert.doesNotMatch(auth, /const SESSION_SECRET\s*=/);
  assert.match(loginLimit, /LOGIN_FAILURE_LIMIT = 5/);
  assert.match(loginLimit, /LOGIN_BLOCK_SECONDS = 15 \* 60/);
  assert.match(loginLimit, /cf-connecting-ip/);
  assert.match(loginLimit, /CREATE TABLE IF NOT EXISTS admin_login_attempts/);
  assert.match(access, /cf-connecting-ip/);
  assert.match(access, /cf-ray/);
  assert.match(access, /192/);
  assert.match(authRoute, /rejectPublicAdmin/);
  assert.match(contentRoute, /!await isAdminRequest\(request\)/);
  assert.match(contentRoute, /!isAdminAccessAllowed\(request\.headers\)/);
  assert.match(panel, /\/api\/content\?admin=1/);
  assert.match(panel, /退出登录/);
  assert.match(chrome, /isPrivateHostname\(window\.location\.hostname\)/);
  assert.match(css, /\.admin-login-page \{[^}]*min-height:100svh;[^}]*place-items:center;/s);
});

test("keeps the scroll effect native, layered, and responsive", async () => {
  const [component, hero, page, css] = await Promise.all([
    readFile(new URL("../components/HomeScrollCover.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /className="home-scroll-cover"/);
  assert.match(component, /className="home-hero-stage"/);
  assert.match(component, /className="home-content-panel"/);
  assert.match(page, /<HomeScrollCover hero=\{<Hero \/>\}>/);
  assert.match(css, /\.home-hero-stage\s*\{[^}]*position:sticky;[^}]*top:0;/s);
  assert.match(css, /\.home-content-panel\s*\{[^}]*z-index:2;[^}]*border-radius:/s);
  assert.match(hero, /const \{ scrollY \} = useScroll\(\)/);
  assert.match(hero, /useTransform\(scrollY, \(value\) => -value\)/);
  assert.match(hero, /autoPlay muted loop playsInline/);
  assert.match(hero, /className="hero-scroll-copy"[\s\S]*className="hero-index"[\s\S]*Independent creative \/ 2026/);
  assert.doesNotMatch(component, /wheel|preventDefault|addEventListener|useScroll/);
});

test("uses stable mobile compositing for image-heavy Home content", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.home-content-background \{[^}]*home-content-moon-mobile\.jpg/s);
  assert.doesNotMatch(css, /\.home-content-background \{[^}]*filter:blur/s);
  assert.match(css, /\.post-card,\.video-card \{[^}]*backdrop-filter:none;[^}]*-webkit-backdrop-filter:none;/s);
  assert.match(css, /\.noise \{ display:none; \}/);
  assert.match(css, /\.site-header \{[^}]*mix-blend-mode:normal;/s);
});

test("preserves the main content routes", async () => {
  for (const pathname of ["/posts", "/videos", "/downloads", "/about"]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, pathname);
  }
});

test("uses reliable native links for local navigation", async () => {
  const [chrome, home, postCard, article] = await Promise.all([
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PostCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of [chrome, home, postCard, article]) {
    assert.doesNotMatch(source, /next\/link|<Link\b/);
  }
  assert.match(chrome, /<a key=\{href\} href=\{href\}/);
});

test("adds a guarded curved-curtain transition for internal navigation", async () => {
  const [chrome, transition, css] = await Promise.all([
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PageTransition.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(chrome, /<PageTransition \/>/);
  assert.match(transition, /document\.addEventListener\("click", handleNavigation, true\)/);
  assert.match(transition, /anchor\.hasAttribute\("download"\)/);
  assert.match(transition, /destination\.origin !== window\.location\.origin/);
  assert.match(transition, /event\.metaKey \|\| event\.ctrlKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(transition, /phaseRef\.current !== "idle"/);
  assert.match(transition, /root\.style\.scrollBehavior = "auto"/);
  assert.match(transition, /window\.scrollTo\(0, 0\)/);
  assert.match(transition, /}, 500\);/);
  assert.match(transition, /window\.dispatchEvent\(new Event\("xhub:page-reveal-content"\)\)/);
  assert.match(chrome, /delay: hasMounted \? \.4 : 0/);
  assert.match(css, /\.page-transition-screen \{[^}]*background:#141517;[^}]*will-change:transform;/s);
  assert.match(css, /\.page-transition-curve \{[^}]*border-radius:50%;/s);
  assert.match(css, /html\.is-page-transitioning body \{ overflow:hidden; \}/);
});

test("does not lift the Home content panel into view during a direct refresh", async () => {
  const chrome = await readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8");
  assert.match(chrome, /const \[hasMounted, setHasMounted\] = useState\(false\)/);
  assert.match(chrome, /useEffect\(\(\) => setHasMounted\(true\), \[\]\)/);
  assert.match(chrome, /initial=\{hasMounted \? \{ opacity: 1, y: 38 \} : false\}/);
});

test("uses stable compositing for Home scrolling and page transitions", async () => {
  const [layout, transition, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PageTransition.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(css, /html \{[^}]*scrollbar-gutter:stable;/s);
  assert.match(css, /\.home-content-background \{[^}]*home-content-moon-mobile\.jpg[^}]*contain:paint;|\.home-content-background \{[^}]*contain:paint;[^}]*home-content-moon-mobile\.jpg/s);
  assert.doesNotMatch(css, /\.home-content-background \{[^}]*filter:blur/s);
  assert.match(css, /\.page-transition-screen \{[^}]*backface-visibility:hidden;/s);
  assert.match(css, /\.page-transition-screen \{[^}]*overflow:visible;/s);
  assert.doesNotMatch(css, /\.page-transition-screen \{[^}]*contain:paint;/s);
  assert.match(transition, /root\.style\.scrollBehavior = "auto"/);
  assert.match(transition, /phaseRef\.current = "covering"/);
  assert.match(layout, /<html lang="zh-CN" suppressHydrationWarning>/);
});

test("keeps fast-scrolled Home cards visible while their entrance motion starts", async () => {
  const [reveal, postCard, videoCard, downloadRow, css] = await Promise.all([
    readFile(new URL("../components/Reveal.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PostCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/VideoCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/DownloadRow.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const source of [reveal, postCard, videoCard, downloadRow]) {
    assert.match(source, /initial=\{\{ opacity:\s*1,/);
    assert.match(source, /margin:\s*"35% 0px"/);
    assert.doesNotMatch(source, /initial=\{\{ opacity:\s*0,/);
  }
  assert.match(postCard, /priority=\{index < 2\}/);
  assert.match(videoCard, /priority=\{index < 2\}/);
  assert.match(css, /\.scroll-reveal,\.post-card,\.video-card,\.download-row \{ backface-visibility:hidden; \}/);
});

test("avoids large runtime blur layers while preserving the glass card styling", async () => {
  const [hero, css] = await Promise.all([
    readFile(new URL("../components/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const selector of ["home-about-card", "post-card,\\.video-card", "download-list"]) {
    assert.match(css, new RegExp(`\\.${selector} \\{[^}]*backdrop-filter:none;[^}]*-webkit-backdrop-filter:none;`, "s"));
  }
  assert.doesNotMatch(css, /\.home-about-grid::before \{[^}]*filter:blur/s);
  assert.doesNotMatch(css, /\.home-videos-section::before \{[^}]*filter:blur/s);
  assert.doesNotMatch(css, /\.post-card::after,\.video-card::after \{[^}]*filter:blur/s);
  assert.match(hero, /backgroundVideoRef/);
  assert.match(hero, /position <= window\.innerHeight \* 1\.05/);
  assert.match(hero, /video\.pause\(\)/);
});

test("shows a centered first-visit scripted windmill loader without replaying on internal navigation", async () => {
  const [chrome, layout, loader, css] = await Promise.all([
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/InitialLoader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(chrome, /<InitialLoader \/>/);
  assert.match(layout, /INITIAL_LOADER_BOOTSTRAP/);
  assert.match(loader, /INITIAL_LOADER_SEEN_KEY/);
  assert.match(loader, /sessionStorage\.setItem\(INITIAL_LOADER_SEEN_KEY, "true"\)/);
  assert.match(loader, /waitForHeroVideo\(\)/);
  assert.match(loader, /\/images\/loading-script\.jpg/);
  assert.match(loader, /\/images\/loading-windmill\.png/);
  assert.match(css, /\.initial-loader \{[^}]*position:fixed;[^}]*inset:0;[^}]*display:grid;[^}]*place-items:center;[^}]*background:#fff;/s);
  assert.match(css, /\.initial-loader-mark \{[^}]*position:relative;[^}]*width:min\(59vw,900px\);/s);
  assert.match(css, /\.initial-loader-windmill-anchor \{[^}]*left:68\.9%;[^}]*top:38\.6%;[^}]*width:330px;/s);
  assert.match(css, /\.initial-loader-windmill \{[^}]*transform-origin:50% 50%;[^}]*animation:initial-loader-spin 4\.5s/s);
  assert.match(css, /@keyframes initial-loader-spin \{ to \{ transform:rotate\(360deg\); \} \}/);
});

test("starts the Home typography entrance only after the first loader fully exits", async () => {
  const [hero, loader, bootstrap] = await Promise.all([
    readFile(new URL("../components/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/InitialLoader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/initial-loader.ts", import.meta.url), "utf8"),
  ]);
  assert.match(bootstrap, /classList\.add\("is-initial-loading"\)/);
  assert.match(loader, /window\.dispatchEvent\(new Event\("xhub:initial-loader-complete"\)\)/);
  assert.match(hero, /window\.addEventListener\(revealEvent, startIntro/);
  assert.match(hero, /"xhub:page-reveal-content"/);
  assert.match(hero, /animate=\{\{ y: introReady \? 0 : "105%" \}\}/);
  assert.match(hero, /opacity: introReady \? 1 : 0/);
});

test("includes the local Pio Live2D widget without extra model controls", async () => {
  const [chrome, widget, css, modelSettings] = await Promise.all([
    readFile(new URL("../components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Live2DPio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/live2d/pio/index.json", import.meta.url), "utf8"),
  ]);

  assert.match(chrome, /<Live2DPio \/>/);
  assert.match(chrome, /Live2D · live2d-widget · Pio/);
  assert.match(widget, /欢迎来到/);
  assert.match(widget, /满天翔的小站/);
  assert.match(widget, /sessionStorage\.getItem\(WELCOME_SHOWN_KEY\)/);
  assert.match(widget, /sessionStorage\.setItem\(WELCOME_SHOWN_KEY, "true"\)/);
  assert.match(widget, /不要我了吗/);
  assert.match(widget, /我可爱吗？/);
  assert.match(widget, /你能常来看看我吗？/);
  assert.match(widget, /24000 \+ Math\.random\(\) \* 12000/);
  assert.match(widget, /document\.addEventListener\("pointermove"/);
  assert.match(css, /@media \(max-width:800px\)[\s\S]*\.pio-waifu \{ left:7px!important; top:auto!important; bottom:3px!important;/);
  assert.match(css, /\.pio-bubble \{[^}]*background:rgba\(253,241,193,\.8\);[^}]*color:#666;[^}]*box-shadow:0 3px 15px 2px rgba\(191,158,118,\.2\);/s);
  assert.match(modelSettings, /"model":"model\.moc"/);
  assert.match(modelSettings, /"textures\/default-costume\.png"/);
  assert.doesNotMatch(widget, /changeModel|changeTexture|screenshot|nightMode/);
});

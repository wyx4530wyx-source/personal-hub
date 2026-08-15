"use client";

import { useEffect, useState } from "react";
import posts from "@/data/posts.json";
import videos from "@/data/videos.json";
import downloads from "@/data/downloads.json";
import { PostCard } from "./PostCard";
import { VideoCard } from "./VideoCard";
import { DownloadRow } from "./DownloadRow";

type ApiItem = {
  id: string;
  type: "post" | "video" | "download";
  slug: string;
  title: string;
  description: string;
  body: string;
  cover: string | null;
  file: string | null;
  fileName: string | null;
  size: string;
  publishedAt: string;
  createdAt: number;
};

function useContent(type: ApiItem["type"]) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/content?type=${type}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setItems(data.items || []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type]);
  return { items, loading };
}

export function LivePosts({ limit }: { limit?: number }) {
  const content = useContent("post");
  const uploaded = content.items.map((item) => ({
    slug: item.slug,
    title: item.title,
    date: item.publishedAt.replaceAll("-", "."),
    category: "我的发布",
    cover: item.cover || "/images/geometry.jpg",
    excerpt: item.description,
  }));
  const all = [...uploaded, ...posts];
  return <div className={`post-grid ${limit ? "" : "archive-grid"}`} data-page-loading={content.loading ? "true" : undefined}>{all.slice(0, limit).map((post, index) => <PostCard key={post.slug} post={post} index={index} />)}</div>;
}

export function HomeRecentPosts({ limit = 3 }: { limit?: number }) {
  const content = useContent("post");
  const uploaded = content.items.map((item) => ({
    slug: item.slug,
    title: item.title,
    date: item.publishedAt.replaceAll("-", "."),
    order: item.createdAt || Date.parse(item.publishedAt),
  }));
  const local = (posts as Array<{ slug:string; title:string; date:string }>).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    order: Date.parse(post.date.replaceAll(".", "-")),
  }));
  const recent = [...uploaded, ...local]
    .sort((a, b) => b.order - a.order)
    .slice(0, limit);

  if (!recent.length) {
    return <div className="home-recent-list" data-page-loading={content.loading ? "true" : undefined}><p className="home-recent-empty">暂无帖子</p></div>;
  }

  return (
    <div className="home-recent-list" aria-label="最新发布的帖子" data-page-loading={content.loading ? "true" : undefined}>
      {recent.map((post, index) => (
        <a href={`/posts/${post.slug}`} key={post.slug}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{post.title}</strong>
          <time dateTime={post.date.replaceAll(".", "-")}>{post.date}</time>
          <b aria-hidden="true">→</b>
        </a>
      ))}
    </div>
  );
}

export function LiveVideos({ limit }: { limit?: number }) {
  const content = useContent("video");
  const uploaded = content.items.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.publishedAt.replaceAll("-", "."),
    duration: "我的视频",
    description: item.description,
    poster: item.cover || "/images/concrete.jpg",
    src: item.file || "",
  }));
  const all = [...uploaded, ...videos];
  return <div className="video-grid" data-page-loading={content.loading ? "true" : undefined}>{all.slice(0, limit).map((video, index) => <VideoCard key={video.id} video={video} index={index} />)}</div>;
}

export function LiveDownloads({ limit }: { limit?: number }) {
  const content = useContent("download");
  const uploaded = content.items.map((item) => ({
    id: item.id,
    name: item.title || item.fileName || "未命名文件",
    description: item.description,
    size: item.size,
    file: item.file || "#",
  }));
  const all = [...uploaded, ...downloads];
  return <div className="download-list" data-page-loading={content.loading ? "true" : undefined}>{all.slice(0, limit).map((item, index) => <DownloadRow key={item.id} item={item} index={index} />)}</div>;
}

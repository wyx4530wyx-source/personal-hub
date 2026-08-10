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
};

function useContent(type: ApiItem["type"]) {
  const [items, setItems] = useState<ApiItem[]>([]);
  useEffect(() => {
    fetch(`/api/content?type=${type}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [type]);
  return items;
}

export function LivePosts({ limit }: { limit?: number }) {
  const uploaded = useContent("post").map((item) => ({
    slug: item.slug,
    title: item.title,
    date: item.publishedAt.replaceAll("-", "."),
    category: "我的发布",
    cover: item.cover || "/images/geometry.jpg",
    excerpt: item.description,
  }));
  const all = [...uploaded, ...posts];
  return <div className={`post-grid ${limit ? "" : "archive-grid"}`}>{all.slice(0, limit).map((post, index) => <PostCard key={post.slug} post={post} index={index} />)}</div>;
}

export function LiveVideos({ limit }: { limit?: number }) {
  const uploaded = useContent("video").map((item) => ({
    id: item.id,
    title: item.title,
    date: item.publishedAt.replaceAll("-", "."),
    duration: "我的视频",
    description: item.description,
    poster: item.cover || "/images/concrete.jpg",
    src: item.file || "",
  }));
  const all = [...uploaded, ...videos];
  return <div className="video-grid">{all.slice(0, limit).map((video, index) => <VideoCard key={video.id} video={video} index={index} />)}</div>;
}

export function LiveDownloads({ limit }: { limit?: number }) {
  const uploaded = useContent("download").map((item) => ({
    id: item.id,
    name: item.title || item.fileName || "未命名文件",
    description: item.description,
    size: item.size,
    file: item.file || "#",
  }));
  const all = [...uploaded, ...downloads];
  return <div className="download-list">{all.slice(0, limit).map((item, index) => <DownloadRow key={item.id} item={item} index={index} />)}</div>;
}

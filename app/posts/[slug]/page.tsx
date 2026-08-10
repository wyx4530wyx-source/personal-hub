import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import posts from "@/data/posts.json";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getStoredContentBySlug, mediaUrl } from "@/lib/content-store";
export function generateStaticParams() { return posts.map((post) => ({ slug:post.slug })); }
export default async function PostDetail({ params }: { params:Promise<{ slug:string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  let display = post ? { title:post.title, category:post.category, date:post.date, cover:post.cover, content:post.content, gallery:post.gallery } : null;
  if (!display) {
    try {
      const stored = await getStoredContentBySlug(slug);
      if (stored?.type === "post") {
        const keys = JSON.parse(stored.galleryKeys || "[]") as string[];
        display = { title:stored.title, category:"我的发布", date:stored.publishedAt.replaceAll("-", "."), cover:mediaUrl(stored.coverKey) || "/images/geometry.jpg", content:stored.body, gallery:keys.map((key) => mediaUrl(key) as string) };
      }
    } catch { display = null; }
  }
  if (!display) notFound();
  return <article className="article"><Link href="/posts" className="article-back">← Back to posts</Link><header className="article-header"><h1>{display.title}</h1><div className="article-meta"><span>{display.category}</span><time>{display.date}</time><span>我的文章</span></div></header><div className="article-cover"><Image src={display.cover} alt="" width={1800} height={1000} priority /></div><MarkdownBody content={display.content} /><div className="article-gallery">{display.gallery.map((image) => <Image key={image} src={image} alt="" width={900} height={1100} />)}</div></article>;
}

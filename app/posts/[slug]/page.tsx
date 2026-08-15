import Image from "next/image";
import { notFound } from "next/navigation";
import posts from "@/data/posts.json";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getStoredContentBySlug, mediaUrl, parseContentBlocks, type PublicContentBlock } from "@/lib/content-store";

type DisplayPost = {
  title:string;
  category:string;
  date:string;
  cover:string;
  content:string;
  gallery:string[];
  contentBlocks:PublicContentBlock[];
};

export function generateStaticParams() { return posts.map((post) => ({ slug:post.slug })); }
export default async function PostDetail({ params }: { params:Promise<{ slug:string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  let display: DisplayPost | null = post ? { title:post.title, category:post.category, date:post.date, cover:post.cover, content:post.content, gallery:post.gallery, contentBlocks:[] } : null;
  if (!display) {
    try {
      const stored = await getStoredContentBySlug(slug);
      if (stored?.type === "post") {
        const keys = JSON.parse(stored.galleryKeys || "[]") as string[];
        display = { title:stored.title, category:"我的发布", date:stored.publishedAt.replaceAll("-", "."), cover:mediaUrl(stored.coverKey) || "/images/geometry.jpg", content:stored.body, gallery:keys.map((key) => mediaUrl(key) as string), contentBlocks:parseContentBlocks(stored.contentBlocks) };
      }
    } catch { display = null; }
  }
  if (!display) notFound();
  return <article className="article"><a href="/posts" className="article-back">← Back to posts</a><header className="article-header"><h1>{display.title}</h1><div className="article-meta"><span>{display.category}</span><time>{display.date}</time><span>我的文章</span></div></header><div className="article-cover"><Image src={display.cover} alt="" width={1800} height={1000} priority /></div>{display.contentBlocks.length ? <div className="article-content-blocks">{display.contentBlocks.map((block, index) => block.type === "text" ? <MarkdownBody key={`text-${index}`} content={block.text} /> : <figure className="article-block-image" key={`image-${index}`}><img src={block.src} alt={block.alt} />{block.alt && <figcaption>{block.alt}</figcaption>}</figure>)}</div> : <><MarkdownBody content={display.content} /><div className="article-gallery">{display.gallery.map((image) => <Image key={image} src={image} alt="" width={900} height={1100} />)}</div></>}</article>;
}

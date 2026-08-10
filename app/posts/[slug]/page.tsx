import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import posts from "@/data/posts.json";
import { MarkdownBody } from "@/components/MarkdownBody";
export function generateStaticParams() { return posts.map((post) => ({ slug:post.slug })); }
export default async function PostDetail({ params }: { params:Promise<{ slug:string }> }) {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();
  return <article className="article"><Link href="/posts" className="article-back">← Back to posts</Link><header className="article-header"><h1>{post.title}</h1><div className="article-meta"><span>{post.category}</span><time>{post.date}</time><span>4 min read</span></div></header><div className="article-cover"><Image src={post.cover} alt="" width={1800} height={1000} priority /></div><MarkdownBody content={post.content} /><div className="article-gallery">{post.gallery.map((image) => <Image key={image} src={image} alt="" width={900} height={1100} />)}</div></article>;
}

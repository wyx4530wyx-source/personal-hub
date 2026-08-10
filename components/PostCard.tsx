"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
type Post = { slug:string; title:string; date:string; category:string; cover:string; excerpt:string };
export function PostCard({ post, index }: { post:Post; index:number }) {
  return <motion.article className="post-card wide" initial={{ opacity:0,y:42 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true,margin:"-8%" }} transition={{ duration:.7,delay:index*.08,ease:[.22,1,.36,1] }} whileHover={{ y:-8 }}><Link href={`/posts/${post.slug}`}><div className="media-frame"><Image src={post.cover} alt="" fill sizes="(max-width: 800px) 100vw, 60vw" /></div><div className="card-meta"><span>{post.category}</span><time>{post.date}</time></div><h3 className="card-title">{post.title}</h3></Link></motion.article>;
}

import type { Metadata } from "next";
import posts from "@/data/posts.json";
import { PageHero } from "@/components/PageHero";
import { PostCard } from "@/components/PostCard";
export const metadata:Metadata = { title:"Posts" };
export default function PostsPage() { return <div className="page-content"><PageHero index="01 / Posts" title="Writing & notes" count={`${posts.length} entries`} description="Thoughts in progress, visual diaries, and practical notes about learning, making, and paying closer attention." /><div className="post-grid archive-grid">{posts.map((post,index) => <PostCard key={post.slug} post={post} index={index} />)}</div></div>; }

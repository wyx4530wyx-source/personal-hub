import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { LivePosts } from "@/components/LiveContent";
export const metadata:Metadata = { title:"Posts" };
export default function PostsPage() { return <div className="page-content"><PageHero index="01 / Posts" title="Writing & notes" count="持续更新" description="Thoughts in progress, visual diaries, and practical notes about learning, making, and paying closer attention." /><LivePosts /></div>; }

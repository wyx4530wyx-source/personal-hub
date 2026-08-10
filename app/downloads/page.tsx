import type { Metadata } from "next";
import downloads from "@/data/downloads.json";
import { PageHero } from "@/components/PageHero";
import { DownloadRow } from "@/components/DownloadRow";
export const metadata:Metadata = { title:"Downloads" };
export default function DownloadsPage() { return <div className="page-content"><PageHero index="03 / Downloads" title="Useful things" count={`${downloads.length} files`} description="Templates, notes, and small resources made to be used. Everything here is free to download and adapt." /><div className="download-list">{downloads.map((item,index) => <DownloadRow key={item.id} item={item} index={index} />)}</div></div>; }

"use client";
import { motion } from "framer-motion";
type Download = { id:string; name:string; description:string; size:string; file:string };
export function DownloadRow({ item, index }: { item:Download; index:number }) {
  return <motion.article className="download-row" initial={{ opacity:0,x:-20 }} whileInView={{ opacity:1,x:0 }} viewport={{ once:true }} transition={{ duration:.55,delay:index*.06 }}><span className="download-index">{String(index+1).padStart(2,"0")}</span><span className="download-name">{item.name}</span><span className="download-description">{item.description}</span><span className="download-size">{item.size}</span><a href={item.file} download className="download-button" aria-label={`Download ${item.name}`}>↓</a></motion.article>;
}

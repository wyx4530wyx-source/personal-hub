"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
type Video = { id:string; title:string; date:string; duration:string; description:string; poster:string; src:string };
export function VideoCard({ video, index }: { video:Video; index:number; compact?:boolean }) {
  const [playing,setPlaying] = useState(false);
  return <motion.article className="video-card" initial={{ opacity:1,y:28 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true,margin:"35% 0px" }} transition={{ duration:.7,delay:index*.08 }}><div className="media-frame">{playing ? <video src={video.src} poster={video.poster} controls autoPlay playsInline aria-label={video.title} /> : <button onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`} style={{ position:"absolute",inset:0,border:0,padding:0,cursor:"pointer",background:"none" }}><Image src={video.poster} alt="" fill priority={index < 2} sizes="(max-width: 800px) 100vw, 50vw" /><span className="play-hint"><span>PLAY</span></span></button>}</div><div className="card-meta"><time>{video.date}</time><span>{video.duration}</span></div><h2>{video.title}</h2><p className="video-description">{video.description}</p></motion.article>;
}

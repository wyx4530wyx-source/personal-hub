"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type SiteTrack = { title:string; artist:string; src:string };

export const siteTracks: SiteTrack[] = [
  { title: "独角", artist: "Local track", src: "/audio/unicorn.mp3" },
  { title: "At The Mountain Behind", artist: "Local track", src: "/audio/at-the-mountain-behind.mp3" },
  { title: "Bloom of Youth", artist: "Key Sounds Label", src: "/audio/bloom-of-youth.mp3" },
  { title: "未闻花名（小提琴版）", artist: "灵魂配乐师", src: "/audio/anohana-violin.mp3" },
  { title: "夏影", artist: "麻枝准", src: "/audio/natsukage.mp3" },
  { title: "サイエンス (feat. 重音テト)", artist: "MIMI & 重音テト", src: "/audio/science-feat-kasane-teto.mp3" },
];

type SiteMusicValue = {
  tracks: SiteTrack[];
  trackIndex: number;
  track: SiteTrack;
  playing: boolean;
  currentTime: number;
  duration: number;
  togglePlay: () => void;
  chooseTrack: (index: number) => void;
  seek: (time: number) => void;
};

const SiteMusicContext = createContext<SiteMusicValue | null>(null);

export function SiteMusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldResumeRef = useRef(false);
  const [tracks, setTracks] = useState<SiteTrack[]>(siteTracks);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const track = tracks[trackIndex] || siteTracks[0];

  useEffect(() => {
    let active = true;
    const loadCloudTracks = async () => {
      try {
        const response = await fetch("/api/content?type=music", { cache:"no-store" });
        if (!response.ok) throw new Error("读取云端音乐失败");
        const data = await response.json() as { items?:Array<{ title?:string; description?:string; file?:string|null }> };
        const uploaded = (data.items || [])
          .filter((item): item is { title:string; description?:string; file:string } => Boolean(item.title && item.file))
          .map((item) => ({ title:item.title, artist:item.description || "Cloud track", src:item.file }));
        if (active) setTracks([...siteTracks, ...uploaded]);
      } catch {
        if (active) setTracks(siteTracks);
      }
    };
    const refresh = () => { void loadCloudTracks(); };
    void loadCloudTracks();
    window.addEventListener("xhub:music-library-changed", refresh);
    return () => { active = false; window.removeEventListener("xhub:music-library-changed", refresh); };
  }, []);

  useEffect(() => {
    if (trackIndex >= tracks.length) setTrackIndex(0);
  }, [trackIndex, tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    if (shouldResumeRef.current) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [track.src]);

  const chooseTrack = (nextIndex: number) => {
    shouldResumeRef.current = playing;
    setTrackIndex((nextIndex + tracks.length) % tracks.length);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <SiteMusicContext.Provider value={{ tracks, trackIndex, track, playing, currentTime, duration, togglePlay, chooseTrack, seek }}>
      <audio
        className="site-music-audio"
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { shouldResumeRef.current = true; setTrackIndex((value) => (value + 1) % tracks.length); }}
      />
      {children}
    </SiteMusicContext.Provider>
  );
}

export function useSiteMusic() {
  const value = useContext(SiteMusicContext);
  if (!value) throw new Error("useSiteMusic must be used within SiteMusicProvider");
  return value;
}

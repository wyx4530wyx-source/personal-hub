"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export const siteTracks = [
  { title: "独角", artist: "Local track", src: "/audio/unicorn.mp3" },
  { title: "At The Mountain Behind", artist: "Local track", src: "/audio/at-the-mountain-behind.mp3" },
  { title: "Bloom of Youth", artist: "Key Sounds Label", src: "/audio/bloom-of-youth.mp3" },
  { title: "未闻花名（小提琴版）", artist: "灵魂配乐师", src: "/audio/anohana-violin.mp3" },
  { title: "夏影", artist: "麻枝准", src: "/audio/natsukage.mp3" },
  { title: "サイエンス (feat. 重音テト)", artist: "MIMI & 重音テト", src: "/audio/science-feat-kasane-teto.mp3" },
];

type SiteMusicValue = {
  trackIndex: number;
  track: (typeof siteTracks)[number];
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
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const track = siteTracks[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    if (shouldResumeRef.current) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [trackIndex]);

  const chooseTrack = (nextIndex: number) => {
    shouldResumeRef.current = playing;
    setTrackIndex((nextIndex + siteTracks.length) % siteTracks.length);
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
    <SiteMusicContext.Provider value={{ trackIndex, track, playing, currentTime, duration, togglePlay, chooseTrack, seek }}>
      <audio
        className="site-music-audio"
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { shouldResumeRef.current = true; setTrackIndex((value) => (value + 1) % siteTracks.length); }}
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

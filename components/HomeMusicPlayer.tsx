"use client";

import { useState } from "react";
import { siteTracks, useSiteMusic } from "@/components/SiteMusic";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function HomeMusicPlayer() {
  const { trackIndex, track, playing, currentTime, duration, togglePlay, chooseTrack, seek } = useSiteMusic();
  const [playlistOpen, setPlaylistOpen] = useState(false);

  return (
    <div className="home-about-card home-about-music">
      <div className="home-music-heading">
        <div className={`home-music-cover${playing ? " is-playing" : ""}`} aria-hidden="true"><span>♪</span></div>
        <div className="home-music-title"><p className="eyebrow">Music player</p><h3>{track.title}</h3><p>{track.artist}</p></div>
        <button className="home-music-list-toggle" type="button" onClick={() => setPlaylistOpen((value) => !value)} aria-expanded={playlistOpen} aria-label="打开或关闭播放列表">{playlistOpen ? "收起" : "列表"}</button>
      </div>
      <div className="home-music-progress">
        <span>{formatTime(currentTime)}</span>
        <input aria-label="音乐播放进度" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => seek(Number(event.target.value))} />
        <span>{formatTime(duration)}</span>
      </div>
      <div className="home-music-controls">
        <button type="button" onClick={() => chooseTrack(trackIndex - 1)} aria-label="上一首">◀</button>
        <button className="home-music-play" type="button" onClick={togglePlay} aria-label={playing ? "暂停" : "播放"}>{playing ? "Ⅱ" : "▶"}</button>
        <button type="button" onClick={() => chooseTrack(trackIndex + 1)} aria-label="下一首">▶</button>
      </div>
      <div className={`home-music-playlist${playlistOpen ? " is-open" : ""}`} aria-hidden={!playlistOpen}>
        <button className="home-music-playlist-close" type="button" onClick={() => setPlaylistOpen(false)} aria-label="关闭播放列表" tabIndex={playlistOpen ? 0 : -1}>×</button>
        {siteTracks.map((item, index) => (
          <button className={index === trackIndex ? "is-current" : ""} type="button" key={item.src} onClick={() => chooseTrack(index)} tabIndex={playlistOpen ? 0 : -1}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.artist}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

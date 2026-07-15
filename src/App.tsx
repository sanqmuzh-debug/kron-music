import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import type { LyricPlayerRef } from "@applemusic-like-lyrics/react";
import { parseLrc, parseTTML } from "@applemusic-like-lyrics/lyric";
import type { LyricLine, LyricPlayerBase } from "@applemusic-like-lyrics/core";
import { ListMusic, Menu, MoreHorizontal, Pause, Play, RotateCcw, RotateCw, StepBack, StepForward, Upload } from "lucide-react";
import type { CSSProperties, ChangeEvent, MutableRefObject, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEMO_LRC = `[00:00.000]Breathe in, let the midnight settle
[00:04.000]Blue light moving slow across the room
[00:08.500]Every little wave becomes a signal
[00:13.000]Every quiet second pulls me through
[00:17.800]Stay here while the city turns to water
[00:22.400]Let the distant windows lose their names
[00:27.000]I can hear the color in the silence
[00:31.600]I can feel the current start to change
[00:36.200]Open arms, no hurry, no tomorrow
[00:41.000]Just the pulse beneath a softer sky
[00:45.700]When the last reflection leaves the ocean
[00:50.300]We will still be moving with the tide`;

const DEMO_TRACK: Track = {
  audio: "./demo/kron-midnight-demo.wav",
  lyric: "./demo/kron-midnight-demo.lrc",
  cover: "./cover.svg",
  title: "Midnight Tide",
  artist: "Kron — Afterglow",
};

type Track = {
  audio: string;
  lyric: string;
  cover: string;
  title: string;
  artist: string;
  lyricName?: string;
};

function normalizeLines(lines: LyricLine[]) {
  return lines.map((line) => ({
    ...line,
    words: line.words.map((word) => ({ ...word })),
  }));
}

function fallbackLines() {
  return normalizeLines(parseLrc(DEMO_LRC));
}

function resolveAsset(value: string) {
  if (/^(blob:|data:|https?:\/\/)/i.test(value)) return value;
  return new URL(value.replace(/^\/+/, ""), document.baseURI).toString();
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${(total % 60).toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseLyricText(text: string, name = "") {
  const isTtml = /\.ttml$|\.dfxp$/i.test(name) || /<tt(?:\s|>)/i.test(text);
  return normalizeLines(isTtml ? parseTTML(text).lines : parseLrc(text));
}

function trackFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    ...DEMO_TRACK,
    ...(params.get("music") ? { audio: resolveAsset(params.get("music")!) } : {}),
    ...(params.get("lyric") ? { lyric: resolveAsset(params.get("lyric")!), lyricName: params.get("lyric")! } : {}),
    ...(params.get("cover") ? { cover: resolveAsset(params.get("cover")!) } : {}),
    ...(params.get("title") ? { title: params.get("title")! } : {}),
    ...(params.get("artist") ? { artist: params.get("artist")! } : {}),
  };
}

function getFileTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled";
}

function LyricsView({
  audioRef,
  lyricLines,
  playing,
  reducedMotion,
  syncRef,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  lyricLines: LyricLine[];
  playing: boolean;
  reducedMotion: boolean;
  syncRef: MutableRefObject<((time: number, isSeek?: boolean) => void) | null>;
}) {
  const [corePlayer, setCorePlayer] = useState<LyricPlayerBase | null>(null);

  const attachPlayer = useCallback((value: LyricPlayerRef | null) => {
    setCorePlayer(value?.lyricPlayer ?? null);
  }, []);

  useEffect(() => {
    if (!corePlayer) return;
    corePlayer.setLyricLines(lyricLines, (audioRef.current?.currentTime ?? 0) * 1000);
    corePlayer.setEnableSpring(!reducedMotion);
    corePlayer.setEnableBlur(true);
    corePlayer.setEnableScale(true);
    corePlayer.setOverscanPx(420);
    void corePlayer.calcLayout(true, false);
    corePlayer.update();
  }, [corePlayer, lyricLines, reducedMotion]);

  useEffect(() => {
    if (!corePlayer) return;
    const sync = (time: number, isSeek = false) => {
      const next = Math.max(0, Math.round(time));
      corePlayer.setCurrentTime(next, isSeek);
      if (isSeek) {
        void corePlayer.calcLayout(false, false);
      }
      corePlayer.update();
    };
    syncRef.current = sync;
    return () => {
      if (syncRef.current === sync) syncRef.current = null;
    };
  }, [corePlayer, syncRef]);

  useEffect(() => {
    if (!corePlayer) return;
    if (playing) corePlayer.resume();
    else corePlayer.pause();

    let frame = 0;
    let lastTime = performance.now();
    const update = (now: number) => {
      const audio = audioRef.current;
      const audioTime = audio ? audio.currentTime * 1000 : 0;
      const delta = Math.min(now - lastTime, 64);
      lastTime = now;
      corePlayer.setCurrentTime(Math.round(audioTime));
      corePlayer.update(delta);
      if (!audio || (!audio.paused && !audio.ended)) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [audioRef, corePlayer, playing]);

  return (
    <LyricPlayer
      ref={attachPlayer}
      className="amll-lyrics"
      lyricLines={lyricLines}
      disabled
      playing={playing}
      alignAnchor="center"
      alignPosition={0.46}
      enableSpring={!reducedMotion}
      enableBlur
      enableScale
      wordFadeWidth={0.5}
      style={{ width: "100%", height: "100%", contain: "paint layout", overflow: "hidden" }}
    />
  );
}

export default function App() {
  const initialTrack = useMemo(trackFromQuery, []);
  const [playlist, setPlaylist] = useState<Track[]>([initialTrack]);
  const [trackIndex, setTrackIndex] = useState(0);
  const track = playlist[trackIndex] ?? initialTrack;
  const [lyricLines, setLyricLines] = useState<LyricLine[]>(fallbackLines);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const syncLyricsRef = useRef<((time: number, isSeek?: boolean) => void) | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (playing && !reducedMotion) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3200);
    }
  }, [playing, reducedMotion]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = track.audio;
    audio.load();
    setPlaying(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setDuration(0);
    setError("");
    setLoading(true);
  }, [track.audio]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(track.lyric)
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics request failed (${response.status})`);
        return response.text();
      })
      .then((text) => {
        if (!cancelled) {
          const lines = parseLyricText(text, track.lyricName ?? track.lyric);
          setLyricLines(lines.length ? lines : fallbackLines());
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLyricLines(fallbackLines());
          setLoading(false);
          setError("歌词加载失败，已显示示例歌词");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [track.lyric, track.lyricName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const syncPosition = () => {
      const next = audio.currentTime || 0;
      currentTimeRef.current = next;
      setCurrentTime(next);
    };
    const onMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      syncPosition();
      syncLyricsRef.current?.(audio.currentTime * 1000, true);
      setLoading(false);
    };
    const onTimeUpdate = () => {
      syncPosition();
      syncLyricsRef.current?.(audio.currentTime * 1000);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      if (trackIndex < playlist.length - 1) setTrackIndex((index) => index + 1);
    };
    const onError = () => {
      setLoading(false);
      setError("音频加载失败，请检查 URL 或重新导入文件");
    };
    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("durationchange", onMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("durationchange", onMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [playlist.length, trackIndex]);

  useEffect(() => () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const togglePlaying = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    showControls();
    if (audio.paused) {
      try {
        await audio.play();
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "NotAllowedError") return;
      setError("音频播放失败，请检查资源格式或重新导入文件");
      }
    } else {
      audio.pause();
    }
  }, [showControls]);

  const seek = useCallback((next: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const value = clamp(next, 0, audio.duration);
    audio.currentTime = value;
    currentTimeRef.current = value;
    setCurrentTime(value);
    syncLyricsRef.current?.(value * 1000, true);
    showControls();
  }, [showControls]);

  const seekBy = useCallback((amount: number) => seek(currentTimeRef.current + amount), [seek]);

  const changeTrack = useCallback((direction: number) => {
    if (playlist.length < 2) {
      seek(direction < 0 ? 0 : (audioRef.current?.duration ?? 0));
      return;
    }
    setTrackIndex((index) => clamp(index + direction, 0, playlist.length - 1));
    showControls();
  }, [playlist.length, seek, showControls]);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const audioFiles = files.filter((file) => file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name));
    const lyricFile = files.find((file) => file.type.includes("text") || /\.(lrc|ttml|dfxp)$/i.test(file.name));
    const coverFile = files.find((file) => file.type.startsWith("image/"));
    const lyricUrl = lyricFile ? URL.createObjectURL(lyricFile) : track.lyric;
    const coverUrl = coverFile ? URL.createObjectURL(coverFile) : track.cover;
    const title = audioFiles[0] ? getFileTitle(audioFiles[0].name) : track.title;
    const artist = audioFiles[0] ? "Local file" : track.artist;
    const importedTracks: Track[] = (audioFiles.length ? audioFiles : [null]).map((file) => ({
      audio: file ? URL.createObjectURL(file) : track.audio,
      lyric: lyricUrl,
      lyricName: lyricFile?.name ?? track.lyricName,
      cover: coverUrl,
      title: file ? getFileTitle(file.name) : title,
      artist,
    }));
    objectUrlsRef.current.push(...importedTracks.map((item) => item.audio).filter((url) => url.startsWith("blob:")));
    if (lyricFile) objectUrlsRef.current.push(lyricUrl);
    if (coverFile) objectUrlsRef.current.push(coverUrl);
    setPlaylist(importedTracks);
    setTrackIndex(0);
    event.target.value = "";
    showControls();
  }, [showControls, track]);

  const progress = duration ? currentTime / duration : 0;
  const shellClass = `player-shell ${playing ? "is-playing" : ""} ambient-on`;
  const chromeClass = controlsVisible ? "visible" : "hidden";

  return (
    <main
      className={shellClass}
      onPointerMove={showControls}
      onPointerDown={showControls}
      onKeyDown={showControls}
      tabIndex={-1}
    >
      <div className="fallback-gradient" aria-hidden="true" />
      <BackgroundRender className="amll-background" album={track.cover} playing={playing} staticMode={reducedMotion} fps={30} />
      <div className="background-vignette" aria-hidden="true" />
      <div className="background-grain" aria-hidden="true" />

      <header className={`topbar chrome ${chromeClass}`}>
        <span className="topbar-label">Now Playing</span>
        <div className="topbar-actions">
          <button className="import-button" aria-label="Import music, lyrics, or cover" onClick={() => importInputRef.current?.click()}>
            <Upload size={16} />
            <span>Import</span>
          </button>
          <button className="icon-button menu-button" aria-label="Player menu">
            <Menu size={22} strokeWidth={2.1} />
          </button>
        </div>
        <input ref={importInputRef} className="visually-hidden" type="file" multiple accept="audio/*,image/*,.lrc,.ttml,.dfxp" onChange={handleImport} />
      </header>

      <section className="content-grid">
        <aside className="art-panel">
          <div className="cover-wrap">
            <img className="cover-art" src={track.cover} alt={`${track.title} album artwork`} />
            <div className="cover-glow" aria-hidden="true" />
          </div>

          <div className={`track-meta chrome ${controlsVisible ? "visible" : "soft"}`}>
            <h1>{track.title}</h1>
            <p>{track.artist}</p>
            {error && <small className="status-message" role="status">{error}</small>}
          </div>

          <div className={`transport chrome ${controlsVisible ? "visible" : "soft"}`}>
            <div className="timeline-labels">
              <span>{formatTime(currentTime)}</span>
              <span>{duration ? `-${formatTime(Math.max(0, duration - currentTime))}` : "--:--"}</span>
            </div>
            <input
              className="timeline"
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={Math.min(currentTime, duration || 1)}
              aria-label="Playback position"
              style={{ "--progress": `${progress * 100}%` } as CSSProperties}
              onChange={(event) => seek(Number(event.target.value))}
            />
            <div className="transport-row">
              <button className="more-button" aria-label="More options"><MoreHorizontal size={25} /></button>
              <div className="transport-main">
                <button aria-label="Previous track" title="Previous track" onClick={() => changeTrack(-1)}><StepBack size={20} fill="currentColor" /></button>
                <button aria-label="Back 10 seconds" title="Back 10 seconds" onClick={() => seekBy(-10)}><RotateCcw size={21} /></button>
                <button className="play-button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlaying}>
                  {playing ? <Pause size={31} fill="currentColor" /> : <Play size={31} fill="currentColor" />}
                </button>
                <button aria-label="Forward 10 seconds" title="Forward 10 seconds" onClick={() => seekBy(10)}><RotateCw size={21} /></button>
                <button aria-label="Next track" title="Next track" onClick={() => changeTrack(1)}><StepForward size={20} fill="currentColor" /></button>
              </div>
              <button className="queue-button" aria-label="Playlist"><ListMusic size={21} /></button>
            </div>
          </div>
        </aside>

        <section className="lyrics-panel" aria-label="Synced lyrics">
          <div className="lyrics-stage">
            <LyricsView
              audioRef={audioRef}
              lyricLines={lyricLines}
              playing={playing}
              reducedMotion={reducedMotion}
              syncRef={syncLyricsRef}
            />
            <div className="lyrics-edge top" aria-hidden="true" />
            <div className="lyrics-edge bottom" aria-hidden="true" />
          </div>
        </section>
      </section>

      <div className={`mobile-bar chrome ${chromeClass}`}>
        <div>
          <strong>{track.title}</strong>
          <span>{track.artist}</span>
        </div>
        <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlaying}>
          {playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}
        </button>
        <button aria-label="Import files" onClick={() => importInputRef.current?.click()}><Upload size={20} /></button>
      </div>

      <audio ref={audioRef} preload="metadata" aria-label={`${track.title} audio`} />
      {loading && <div className="loading-indicator chrome visible">Loading</div>}
    </main>
  );
}

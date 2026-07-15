import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import type { LyricPlayerRef } from "@applemusic-like-lyrics/react";
import { parseLrc, parseTTML } from "@applemusic-like-lyrics/lyric";
import type { LyricLine, LyricPlayerBase } from "@applemusic-like-lyrics/core";
import type {
  CSSProperties,
  ChangeEvent,
  MutableRefObject,
  RefObject,
  SVGProps,
} from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type IconProps = SVGProps<SVGSVGElement>;

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 7.25h14M5 12h14M5 16.75h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="5.25" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.75" cy="12" r="1.7" />
    </svg>
  );
}

function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8.6 5.55c0-1.1 1.2-1.78 2.15-1.2l12.02 7.32a2.72 2.72 0 0 1 0 4.66l-12.02 7.32c-.95.58-2.15-.1-2.15-1.2V5.55Z" />
    </svg>
  );
}

function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="7.4" y="5" width="4.55" height="18" rx="1.45" />
      <rect x="16.05" y="5" width="4.55" height="18" rx="1.45" />
    </svg>
  );
}

function PreviousIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="5.2" y="6.1" width="2.2" height="15.8" rx="1.1" />
      <path d="M21.8 7.17c0-1.04-1.16-1.66-2.03-1.08L9.97 12.6a1.67 1.67 0 0 0 0 2.8l9.8 6.51c.87.58 2.03-.04 2.03-1.08V7.17Z" />
    </svg>
  );
}

function NextIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="20.6" y="6.1" width="2.2" height="15.8" rx="1.1" />
      <path d="M6.2 7.17c0-1.04 1.16-1.66 2.03-1.08l9.8 6.51a1.67 1.67 0 0 1 0 2.8l-9.8 6.51c-.87.58-2.03-.04-2.03-1.08V7.17Z" />
    </svg>
  );
}

function LyricsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5.25 5.5h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.4l-3.55 2.7v-2.7H5.25A2.25 2.25 0 0 1 3 15.25v-7.5A2.25 2.25 0 0 1 5.25 5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="8" cy="11.5" r="1" fill="currentColor" />
      <circle cx="12" cy="11.5" r="1" fill="currentColor" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ direction = "left", ...props }: IconProps & { direction?: "left" | "right" | "up" | "down" }) {
  const rotate = direction === "right" ? 180 : direction === "up" ? 90 : direction === "down" ? -90 : 0;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }} {...props}>
      <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RestartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6.5 8.2H3.8V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.3 8.1A8 8 0 1 1 5.6 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  alignPosition,
  syncRef,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  lyricLines: LyricLine[];
  playing: boolean;
  reducedMotion: boolean;
  alignPosition: number;
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
    corePlayer.setOverscanPx(600);
    void corePlayer.calcLayout(true, false);
    corePlayer.update();
  }, [corePlayer, lyricLines, reducedMotion, audioRef]);

  useEffect(() => {
    if (!corePlayer) return;
    const sync = (time: number, isSeek = false) => {
      const next = Math.max(0, Math.round(time));
      corePlayer.setCurrentTime(next, isSeek);
      if (isSeek) void corePlayer.calcLayout(false, false);
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
      const delta = Math.min(now - lastTime, 48);
      lastTime = now;
      corePlayer.setCurrentTime(Math.round(audioTime));
      corePlayer.update(delta);
      if (!audio || (!audio.paused && !audio.ended)) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [audioRef, corePlayer, playing]);

  return (
    <LyricPlayer
      ref={attachPlayer}
      className="amll-lyrics"
      lyricLines={lyricLines}
      disabled
      playing={playing}
      alignAnchor="center"
      alignPosition={alignPosition}
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
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [lyricAlignPosition, setLyricAlignPosition] = useState(0.48);
  const audioRef = useRef<HTMLAudioElement>(null);
  const syncLyricsRef = useRef<((time: number, isSeek?: boolean) => void) | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const lyricStageRef = useRef<HTMLElement>(null);

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
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3600);
    }
  }, [playing, reducedMotion]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  useLayoutEffect(() => {
    const cover = coverRef.current;
    const lyrics = lyricStageRef.current;
    if (!cover || !lyrics) return;

    const updateAlignment = () => {
      const coverBox = cover.getBoundingClientRect();
      const lyricBox = lyrics.getBoundingClientRect();
      if (!lyricBox.height) return;
      const next = (coverBox.top + coverBox.height / 2 - lyricBox.top) / lyricBox.height;
      setLyricAlignPosition(clamp(next, 0.28, 0.72));
    };

    updateAlignment();
    const observer = new ResizeObserver(updateAlignment);
    observer.observe(cover);
    observer.observe(lyrics);
    window.addEventListener("resize", updateAlignment);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateAlignment);
    };
  }, []);

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
  const shellClass = `player-shell ${playing ? "is-playing" : ""} ${ambientEnabled ? "ambient-on" : "ambient-off"}`;
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
      <BackgroundRender
        className="amll-background"
        album={track.cover}
        playing={playing}
        staticMode={reducedMotion || !ambientEnabled}
        fps={reducedMotion ? 1 : 60}
      />
      <div className="background-wash" aria-hidden="true" />

      <button
        className={`menu-button chrome ${chromeClass}`}
        aria-label="Import music, lyrics, or cover"
        onClick={() => importInputRef.current?.click()}
      >
        <MenuIcon />
      </button>
      <input
        ref={importInputRef}
        className="visually-hidden"
        type="file"
        multiple
        accept="audio/*,image/*,.lrc,.ttml,.dfxp"
        onChange={handleImport}
      />

      <nav className={`side-rail side-rail-left chrome ${chromeClass}`} aria-label="Playback shortcuts">
        <button aria-label="Next track" onClick={() => changeTrack(1)}><ChevronIcon direction="right" /></button>
        <button aria-label="Restart track" onClick={() => seek(0)}><RestartIcon /></button>
        <button aria-label="Previous track" onClick={() => changeTrack(-1)}><ChevronIcon direction="left" /></button>
      </nav>

      <nav className={`side-rail side-rail-right chrome ${chromeClass}`} aria-label="Ambient controls">
        <label className="ambient-toggle">
          <input
            type="checkbox"
            checked={ambientEnabled}
            onChange={(event) => setAmbientEnabled(event.target.checked)}
          />
          <span className="toggle-track"><span /></span>
          <span>AP</span>
        </label>
        <button aria-label="Previous track" onClick={() => changeTrack(-1)}><ChevronIcon direction="up" /></button>
        <button aria-label="Next track" onClick={() => changeTrack(1)}><ChevronIcon direction="down" /></button>
      </nav>

      <section className="apple-layout">
        <aside className="player-column">
          <div className="player-stack">
            <div className="cover-wrap" ref={coverRef}>
              <img className="cover-art" src={track.cover} alt={`${track.title} album artwork`} />
            </div>

            <div className={`player-details chrome ${controlsVisible ? "visible" : "soft"}`}>
              <div className="track-meta">
                <h1>{track.title}</h1>
                <p>{track.artist}</p>
                {error && <small className="status-message" role="status">{error}</small>}
              </div>

              <div className="timeline-block">
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
              </div>

              <div className="transport-row">
                <button className="utility-button" aria-label="More options" onClick={() => importInputRef.current?.click()}><MoreIcon /></button>
                <div className="transport-main">
                  <button aria-label="Previous track" onClick={() => changeTrack(-1)}><PreviousIcon /></button>
                  <button className="play-button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlaying}>
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </button>
                  <button aria-label="Next track" onClick={() => changeTrack(1)}><NextIcon /></button>
                </div>
                <button className="utility-button" aria-label="Import files" onClick={() => importInputRef.current?.click()}><LyricsIcon /></button>
              </div>
            </div>
          </div>
        </aside>

        <section className="lyrics-panel" aria-label="Synced lyrics" ref={lyricStageRef}>
          <LyricsView
            audioRef={audioRef}
            lyricLines={lyricLines}
            playing={playing}
            reducedMotion={reducedMotion}
            alignPosition={lyricAlignPosition}
            syncRef={syncLyricsRef}
          />
        </section>
      </section>

      <div className={`mobile-bar chrome ${chromeClass}`}>
        <img src={track.cover} alt="" />
        <div>
          <strong>{track.title}</strong>
          <span>{track.artist}</span>
        </div>
        <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlaying}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button aria-label="Import files" onClick={() => importInputRef.current?.click()}><MenuIcon /></button>
      </div>

      <audio ref={audioRef} preload="metadata" aria-label={`${track.title} audio`} />
      {loading && <div className="loading-indicator" aria-label="Loading"><span /><span /></div>}
    </main>
  );
}

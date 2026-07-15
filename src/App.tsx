import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import { parseLrc } from "@applemusic-like-lyrics/lyric";
import type { LyricLine } from "@applemusic-like-lyrics/core";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DURATION_MS = 55_000;
const COVER_URL = "./cover.svg";

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

function toLyricLines(): LyricLine[] {
  return parseLrc(DEMO_LRC).map((line) => ({
    ...line,
    words: line.words.map((word) => ({ ...word, obscene: false })),
  })) as LyricLine[];
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const lyricLines = useMemo(toLyricLines, []);
  const [currentTime, setCurrentTime] = useState(12_600);
  const [playing, setPlaying] = useState(true);
  const [ambientPulse, setAmbientPulse] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastFrameRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3200);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) {
      lastFrameRef.current = null;
      setControlsVisible(true);
      return;
    }

    let frame = 0;
    const tick = (now: number) => {
      if (lastFrameRef.current == null) lastFrameRef.current = now;
      const delta = Math.min(now - lastFrameRef.current, 64);
      lastFrameRef.current = now;
      setCurrentTime((value) => {
        const next = value + delta;
        if (next >= DURATION_MS) {
          lastFrameRef.current = null;
          return 0;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  const seek = useCallback((next: number) => {
    setCurrentTime(clamp(next, 0, DURATION_MS));
    lastFrameRef.current = null;
  }, []);

  const progress = currentTime / DURATION_MS;

  return (
    <main
      className={`player-shell ${playing ? "is-playing" : ""} ${ambientPulse ? "ambient-on" : ""}`}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <div className="fallback-gradient" aria-hidden="true" />
      <BackgroundRender className="amll-background" album={COVER_URL} />
      <div className="background-vignette" aria-hidden="true" />
      <div className="background-grain" aria-hidden="true" />

      <header className={`topbar chrome ${controlsVisible ? "visible" : "hidden"}`}>
        <button className="icon-button menu-button" aria-label="Open menu">
          <Menu size={24} strokeWidth={2.2} />
        </button>
      </header>

      <section className="content-grid">
        <aside className="art-panel">
          <div className="cover-wrap">
            <img className="cover-art" src={COVER_URL} alt="Midnight Tide album artwork" />
            <div className="cover-glow" aria-hidden="true" />
          </div>

          <div className={`track-meta chrome ${controlsVisible ? "visible" : "soft"}`}>
            <h1>Midnight Tide</h1>
            <p>Kron — Afterglow</p>
          </div>

          <div className={`transport chrome ${controlsVisible ? "visible" : "soft"}`}>
            <div className="timeline-labels">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(DURATION_MS - currentTime)}</span>
            </div>
            <input
              className="timeline"
              type="range"
              min={0}
              max={DURATION_MS}
              step={25}
              value={currentTime}
              aria-label="Playback position"
              style={{ "--progress": `${progress * 100}%` } as React.CSSProperties}
              onChange={(event) => seek(Number(event.target.value))}
            />
            <div className="transport-row">
              <button className="more-button" aria-label="More options">
                <MoreHorizontal size={25} />
              </button>
              <div className="transport-main">
                <button aria-label="Back 5 seconds" onClick={() => seek(currentTime - 5000)}>
                  <SkipBack size={28} fill="currentColor" />
                </button>
                <button
                  className="play-button"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={() => {
                    setPlaying((value) => !value);
                    lastFrameRef.current = null;
                    showControls();
                  }}
                >
                  {playing ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
                <button aria-label="Forward 5 seconds" onClick={() => seek(currentTime + 5000)}>
                  <SkipForward size={28} fill="currentColor" />
                </button>
              </div>
              <button className="queue-button" aria-label="Queue">
                <ListMusic size={21} />
              </button>
            </div>
          </div>
        </aside>

        <section className="lyrics-panel" aria-label="Synced lyrics">
          <div className="lyrics-stage">
            <LyricPlayer
              className="amll-lyrics"
              lyricLines={lyricLines}
              currentTime={currentTime}
              playing={playing}
              alignAnchor="center"
              style={{ width: "100%", height: "100%", contain: "paint layout", overflow: "hidden" }}
            />
            <div className="lyrics-edge top" aria-hidden="true" />
            <div className="lyrics-edge bottom" aria-hidden="true" />
          </div>
        </section>
      </section>

      <nav className={`left-rail chrome ${controlsVisible ? "visible" : "hidden"}`} aria-label="Player navigation">
        <button aria-label="Next view"><ChevronRight size={34} /></button>
        <button aria-label="Restart"><RotateCcw size={24} /></button>
        <button aria-label="Previous view"><ChevronLeft size={34} /></button>
      </nav>

      <aside className={`right-rail chrome ${controlsVisible ? "visible" : "hidden"}`}>
        <label className="ambient-toggle" title="Ambient pulse">
          <input type="checkbox" checked={ambientPulse} onChange={(event) => setAmbientPulse(event.target.checked)} />
          <span className="toggle-track"><span className="toggle-thumb" /></span>
          <span>AP</span>
        </label>
        <div className="rail-chevrons" aria-hidden="true">
          <ChevronDown className="up" size={24} />
          <ChevronDown size={24} />
        </div>
      </aside>

      <div className={`mobile-bar chrome ${controlsVisible ? "visible" : "hidden"}`}>
        <div>
          <strong>Midnight Tide</strong>
          <span>Kron</span>
        </div>
        <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
        <button aria-label="Volume"><Volume2 size={22} /></button>
      </div>
    </main>
  );
}

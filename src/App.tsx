import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import type { LyricPlayerRef } from "@applemusic-like-lyrics/react";
import { parseLrc, parseTTML } from "@applemusic-like-lyrics/lyric";
import type { LyricLine, LyricPlayerBase } from "@applemusic-like-lyrics/core";
import type { CSSProperties, ChangeEvent, MutableRefObject, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  browseCategories,
  demoTracks,
  librarySections,
  madeForYou,
  newReleases,
  radioStations,
  recentlyPlayed,
  type CatalogItem,
} from "./apple-music-data";

type Tab = "home" | "new" | "radio" | "library" | "search";
type Overlay = "player" | "lyrics" | "queue" | "account" | null;

type Track = {
  audio: string;
  lyric: string;
  cover: string;
  title: string;
  artist: string;
  lyricName?: string;
  art?: string;
};

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
  art: "art-ocean",
};

const glyphs = {
  home: "⌂",
  new: "✦",
  radio: "◉",
  library: "♫",
  search: "⌕",
  back: "‹",
  down: "⌄",
  more: "•••",
  play: "▶︎",
  pause: "Ⅱ",
  previous: "|◀︎",
  next: "▶︎|",
  lyrics: "❞",
  queue: "≡",
  shuffle: "⇄",
  repeat: "↻",
  volumeLow: "◖",
  volumeHigh: "◗",
  add: "+",
  check: "✓",
  download: "↓",
  profile: "K",
} as const;

type GlyphName = keyof typeof glyphs;

function Glyph({ name, className = "" }: { name: GlyphName; className?: string }) {
  return <span aria-hidden="true" className={`system-glyph ${className}`}>{glyphs[name]}</span>;
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

function parseLyricText(text: string, name = "") {
  const isTtml = /\.ttml$|\.dfxp$/i.test(name) || /<tt(?:\s|>)/i.test(text);
  return normalizeLines(isTtml ? parseTTML(text).lines : parseLrc(text));
}

function resolveAsset(value: string) {
  if (/^(blob:|data:|https?:\/\/)/i.test(value)) return value;
  return new URL(value.replace(/^\/+/, ""), document.baseURI).toString();
}

function trackFromQuery(): Track {
  const params = new URLSearchParams(window.location.search);
  return {
    ...DEMO_TRACK,
    ...(params.get("music") ? { audio: resolveAsset(params.get("music")!) } : {}),
    ...(params.get("lyric") ? { lyric: resolveAsset(params.get("lyric")!), lyricName: params.get("lyric")! } : {}),
    ...(params.get("cover") ? { cover: resolveAsset(params.get("cover")!), art: undefined } : {}),
    ...(params.get("title") ? { title: params.get("title")! } : {}),
    ...(params.get("artist") ? { artist: params.get("artist")! } : {}),
  };
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFileTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled";
}

function Artwork({ item, className = "" }: { item: Pick<Track, "cover" | "art" | "title">; className?: string }) {
  if (item.art) {
    return <div role="img" aria-label={`${item.title} artwork`} className={`artwork ${item.art} ${className}`}><span>{item.title}</span></div>;
  }
  return <img className={`artwork ${className}`} src={item.cover} alt={`${item.title} artwork`} />;
}

function CatalogArtwork({ item, className = "" }: { item: CatalogItem; className?: string }) {
  return <div role="img" aria-label={`${item.title} artwork`} className={`artwork ${item.art} ${className}`}><span>{item.title}</span></div>;
}

function LyricsView({
  audioRef,
  lyricLines,
  playing,
  syncRef,
  reducedMotion,
  alignPosition = 0.46,
}: {
  audioRef: RefObject<HTMLAudioElement | null>;
  lyricLines: LyricLine[];
  playing: boolean;
  syncRef: MutableRefObject<((time: number, isSeek?: boolean) => void) | null>;
  reducedMotion: boolean;
  alignPosition?: number;
}) {
  const [corePlayer, setCorePlayer] = useState<LyricPlayerBase | null>(null);
  const attachPlayer = useCallback((value: LyricPlayerRef | null) => setCorePlayer(value?.lyricPlayer ?? null), []);

  useEffect(() => {
    if (!corePlayer) return;
    corePlayer.setLyricLines(lyricLines, (audioRef.current?.currentTime ?? 0) * 1000);
    corePlayer.setEnableSpring(!reducedMotion);
    corePlayer.setEnableBlur(true);
    corePlayer.setEnableScale(true);
    corePlayer.setOverscanPx(640);
    void corePlayer.calcLayout(true, false);
    corePlayer.update();
  }, [audioRef, corePlayer, lyricLines, reducedMotion]);

  useEffect(() => {
    if (!corePlayer) return;
    const sync = (time: number, isSeek = false) => {
      corePlayer.setCurrentTime(Math.max(0, Math.round(time)), isSeek);
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
      const delta = Math.min(now - lastTime, 48);
      lastTime = now;
      corePlayer.setCurrentTime(Math.round((audio?.currentTime ?? 0) * 1000));
      corePlayer.update(delta);
      if (audio && !audio.paused && !audio.ended) frame = requestAnimationFrame(update);
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

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && <button type="button">{action}</button>}
    </div>
  );
}

function MediaCard({ item, onSelect, wide = false }: { item: CatalogItem; onSelect: (item: CatalogItem) => void; wide?: boolean }) {
  return (
    <button type="button" className={`media-card ${wide ? "wide" : ""}`} onClick={() => onSelect(item)}>
      <CatalogArtwork item={item} />
      {item.eyebrow && <small>{item.eyebrow}</small>}
      <strong>{item.title}</strong>
      <span>{item.subtitle}</span>
    </button>
  );
}

function Shelf({ title, items, onSelect, wide = false }: { title: string; items: CatalogItem[]; onSelect: (item: CatalogItem) => void; wide?: boolean }) {
  return (
    <section className="content-section">
      <SectionTitle title={title} action="See All" />
      <div className={`media-shelf ${wide ? "wide-shelf" : ""}`}>
        {items.map((item) => <MediaCard key={item.id} item={item} onSelect={onSelect} wide={wide} />)}
      </div>
    </section>
  );
}

function HomeView({ onSelect }: { onSelect: (item: CatalogItem) => void }) {
  return (
    <>
      <section className="editorial-hero">
        <button type="button" className="hero-story hero-primary" onClick={() => onSelect(madeForYou[0])}>
          <div><small>LISTEN NOW</small><h2>Your music.<br />More personal than ever.</h2><p>A continuous mix built around what you love right now.</p></div>
          <CatalogArtwork item={madeForYou[0]} />
        </button>
        <button type="button" className="hero-story hero-secondary" onClick={() => onSelect(recentlyPlayed[0])}>
          <div><small>RECENT FAVORITE</small><h3>Midnight Tide</h3><p>Kron</p></div>
          <CatalogArtwork item={recentlyPlayed[0]} />
        </button>
      </section>
      <Shelf title="Recently Played" items={recentlyPlayed} onSelect={onSelect} />
      <Shelf title="Made for You" items={madeForYou} onSelect={onSelect} wide />
      <Shelf title="New Releases for You" items={newReleases} onSelect={onSelect} />
    </>
  );
}

function NewView({ onSelect }: { onSelect: (item: CatalogItem) => void }) {
  return (
    <>
      <section className="new-feature-grid">
        {newReleases.slice(0, 2).map((item, index) => (
          <button type="button" className={`new-feature feature-${index + 1}`} key={item.id} onClick={() => onSelect(item)}>
            <div><small>NEW ALBUM</small><h2>{item.title}</h2><p>{item.subtitle}</p></div>
            <CatalogArtwork item={item} />
          </button>
        ))}
      </section>
      <Shelf title="New Music" items={newReleases} onSelect={onSelect} />
      <section className="content-section">
        <SectionTitle title="Daily Top 100" action="See All" />
        <div className="chart-list">
          {recentlyPlayed.slice(0, 5).map((item, index) => (
            <button type="button" key={item.id} onClick={() => onSelect(item)}>
              <b>{index + 1}</b><CatalogArtwork item={item} /><div><strong>{item.title}</strong><span>{item.subtitle}</span></div><Glyph name="more" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function RadioView({ onSelect }: { onSelect: (item: CatalogItem) => void }) {
  return (
    <>
      <section className="radio-hero">
        <button type="button" onClick={() => onSelect(radioStations[0])}>
          <div><span className="live-dot" />LIVE NOW</div>
          <h2>Apple Music 1</h2>
          <p>Global sounds. Artist conversations. The music moving culture forward.</p>
          <CatalogArtwork item={radioStations[0]} />
        </button>
      </section>
      <Shelf title="Live Radio" items={radioStations} onSelect={onSelect} wide />
      <Shelf title="Stations for You" items={madeForYou.slice(1)} onSelect={onSelect} />
    </>
  );
}

function LibraryView({ onSelect, onImport }: { onSelect: (item: CatalogItem) => void; onImport: () => void }) {
  return (
    <>
      <section className="library-list glass-list">
        {librarySections.map(([label], index) => (
          <button type="button" key={label} onClick={() => index === 0 ? onSelect(madeForYou[0]) : undefined}>
            <span className="library-icon"><Glyph name={index === 5 ? "download" : index === 3 ? "new" : "library"} /></span>
            <strong>{label}</strong><Glyph name="next" />
          </button>
        ))}
      </section>
      <div className="library-actions"><button type="button" className="glass-button accent" onClick={onImport}><Glyph name="add" /> Add Music</button></div>
      <Shelf title="Recently Added" items={newReleases} onSelect={onSelect} />
    </>
  );
}

function SearchView({ onSelect }: { onSelect: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState("");
  const results = [...recentlyPlayed, ...newReleases, ...madeForYou].filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <label className="search-field"><Glyph name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artists, Songs, Lyrics, and More" /><button type="button" onClick={() => setQuery("")}>{query ? "×" : ""}</button></label>
      {query ? (
        <section className="search-results">
          <SectionTitle title="Top Results" />
          <div className="result-list">
            {results.map((item) => <button type="button" key={item.id} onClick={() => onSelect(item)}><CatalogArtwork item={item} /><div><strong>{item.title}</strong><span>{item.kind} · {item.subtitle}</span></div><Glyph name="more" /></button>)}
          </div>
        </section>
      ) : (
        <section className="content-section">
          <SectionTitle title="Browse Categories" />
          <div className="category-grid">
            {browseCategories.map(([label, className]) => <button type="button" key={label} className={className}><strong>{label}</strong><span>♫</span></button>)}
          </div>
        </section>
      )}
    </>
  );
}

function DetailView({ item, onBack, onPlay }: { item: CatalogItem; onBack: () => void; onPlay: () => void }) {
  return (
    <div className="detail-view">
      <button type="button" className="back-link" onClick={onBack}><Glyph name="back" /> Back</button>
      <section className="detail-hero">
        <CatalogArtwork item={item} />
        <div><small>{item.kind?.toUpperCase()}</small><h1>{item.title}</h1><h3>{item.subtitle}</h3><p>A carefully sequenced collection with seamless transitions, synchronized lyrics, and immersive playback.</p><div className="detail-actions"><button type="button" className="glass-button accent" onClick={onPlay}><Glyph name="play" /> Play</button><button type="button" className="glass-button"><Glyph name="shuffle" /> Shuffle</button><button type="button" className="round-button"><Glyph name="more" /></button></div></div>
      </section>
      <div className="track-list">
        {demoTracks.map(([title, artist, time], index) => <button type="button" key={title} onClick={onPlay}><b>{index + 1}</b><div><strong>{title}</strong><span>{artist}</span></div><span>{time}</span><Glyph name="more" /></button>)}
      </div>
      <div className="detail-notes"><strong>2026 · 6 songs · 6 minutes</strong><span>Lossless · Dolby Atmos</span></div>
    </div>
  );
}

export default function App() {
  const initialTrack = useMemo(trackFromQuery, []);
  const [tab, setTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [track, setTrack] = useState<Track>(initialTrack);
  const [lyricLines, setLyricLines] = useState<LyricLine[]>(fallbackLines);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.82);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactNav, setCompactNav] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const syncLyricsRef = useRef<((time: number, isSeek?: boolean) => void) | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = track.audio;
    audio.load();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");
  }, [track.audio]);

  useEffect(() => {
    let cancelled = false;
    fetch(track.lyric)
      .then((response) => {
        if (!response.ok) throw new Error(`Lyrics request failed (${response.status})`);
        return response.text();
      })
      .then((text) => {
        if (!cancelled) setLyricLines(parseLyricText(text, track.lyricName ?? track.lyric));
      })
      .catch(() => {
        if (!cancelled) {
          setLyricLines(fallbackLines());
          setError("Lyrics unavailable");
        }
      });
    return () => { cancelled = true; };
  }, [track.lyric, track.lyricName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sync = () => {
      setCurrentTime(audio.currentTime || 0);
      syncLyricsRef.current?.((audio.currentTime || 0) * 1000);
    };
    const metadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      syncLyricsRef.current?.((audio.currentTime || 0) * 1000, true);
    };
    const ended = () => {
      setPlaying(false);
      audio.currentTime = 0;
      setCurrentTime(0);
    };
    const fail = () => setError("Audio unavailable — import a local file");
    audio.addEventListener("loadedmetadata", metadata);
    audio.addEventListener("durationchange", metadata);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", fail);
    return () => {
      audio.removeEventListener("loadedmetadata", metadata);
      audio.removeEventListener("durationchange", metadata);
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", fail);
    };
  }, [track.audio]);

  useEffect(() => () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const togglePlaying = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); } catch { setError("Playback blocked — tap Play again or import audio"); }
    } else audio.pause();
  }, []);

  const seek = useCallback((next: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const value = clamp(next, 0, audio.duration);
    audio.currentTime = value;
    setCurrentTime(value);
    syncLyricsRef.current?.(value * 1000, true);
  }, []);

  const selectCatalog = useCallback((item: CatalogItem) => {
    setTrack({ ...DEMO_TRACK, title: item.title, artist: item.subtitle, art: item.art });
    setSelected(item);
  }, []);

  const playCatalog = useCallback(async (item?: CatalogItem) => {
    if (item) setTrack({ ...DEMO_TRACK, title: item.title, artist: item.subtitle, art: item.art });
    setSelected(null);
    setOverlay("player");
    window.setTimeout(() => { void audioRef.current?.play(); }, 60);
  }, []);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const audio = files.find((file) => file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name));
    const lyric = files.find((file) => /\.(lrc|ttml|dfxp)$/i.test(file.name));
    const cover = files.find((file) => file.type.startsWith("image/"));
    const audioUrl = audio ? URL.createObjectURL(audio) : track.audio;
    const lyricUrl = lyric ? URL.createObjectURL(lyric) : track.lyric;
    const coverUrl = cover ? URL.createObjectURL(cover) : track.cover;
    [audioUrl, lyricUrl, coverUrl].filter((url) => url.startsWith("blob:")).forEach((url) => objectUrlsRef.current.push(url));
    setTrack({
      audio: audioUrl,
      lyric: lyricUrl,
      lyricName: lyric?.name,
      cover: coverUrl,
      title: audio ? getFileTitle(audio.name) : track.title,
      artist: audio ? "Local Music" : track.artist,
      art: cover ? undefined : track.art,
    });
    setSelected(null);
    setOverlay("player");
    event.target.value = "";
  }, [track]);

  const title = selected ? selected.title : ({ home: "Home", new: "New", radio: "Radio", library: "Library", search: "Search" } as const)[tab];
  const progress = duration ? currentTime / duration : 0;

  const renderView = () => {
    if (selected) return <DetailView item={selected} onBack={() => setSelected(null)} onPlay={() => playCatalog(selected)} />;
    if (tab === "home") return <HomeView onSelect={selectCatalog} />;
    if (tab === "new") return <NewView onSelect={selectCatalog} />;
    if (tab === "radio") return <RadioView onSelect={selectCatalog} />;
    if (tab === "library") return <LibraryView onSelect={selectCatalog} onImport={() => importInputRef.current?.click()} />;
    return <SearchView onSelect={selectCatalog} />;
  };

  const navItems: [Tab, GlyphName, string][] = [
    ["home", "home", "Home"],
    ["new", "new", "New"],
    ["radio", "radio", "Radio"],
    ["library", "library", "Library"],
    ["search", "search", "Search"],
  ];

  return (
    <main className="music-app">
      <div className="app-aurora" aria-hidden="true" />
      <aside className="desktop-sidebar glass-surface">
        <div className="music-mark"><span>♫</span><strong>Music</strong></div>
        <nav>{navItems.map(([id, icon, label]) => <button type="button" key={id} className={tab === id && !selected ? "active" : ""} onClick={() => { setTab(id); setSelected(null); }}><Glyph name={icon} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer" />
        <button type="button" className="sidebar-account" onClick={() => setOverlay("account")}><span>K</span><div><strong>Kron</strong><small>View Account</small></div></button>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div><small>{selected ? selected.kind : "APPLE MUSIC"}</small><h1>{title}</h1></div>
          <button type="button" className="profile-button glass-surface" onClick={() => setOverlay("account")}>K</button>
        </header>
        <div className="scroll-content" onScroll={(event) => setCompactNav(event.currentTarget.scrollTop > 36)}>{renderView()}</div>
      </section>

      <button type="button" className="mini-player glass-surface" onClick={() => setOverlay("player")}>
        <Artwork item={track} />
        <div><strong>{track.title}</strong><span>{track.artist}</span></div>
        <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={(event) => { event.stopPropagation(); void togglePlaying(); }}><Glyph name={playing ? "pause" : "play"} /></button>
        <button type="button" aria-label="Next"><Glyph name="next" /></button>
      </button>

      <nav className={`bottom-tabs glass-surface ${compactNav ? "compact" : ""}`}>
        {navItems.map(([id, icon, label]) => <button type="button" key={id} className={tab === id && !selected ? "active" : ""} onClick={() => { setTab(id); setSelected(null); }}><Glyph name={icon} /><span>{label}</span></button>)}
      </nav>

      {overlay === "player" && (
        <section className="full-overlay now-playing" aria-label="Now Playing">
          <div className="player-backdrop"><BackgroundRender album={track.cover} playing={playing} staticMode={reducedMotion} fps={reducedMotion ? 1 : 45} /><div /></div>
          <header><button type="button" className="round-button glass-surface" onClick={() => setOverlay(null)}><Glyph name="down" /></button><span>NOW PLAYING</span><button type="button" className="round-button glass-surface"><Glyph name="more" /></button></header>
          <div className="now-playing-grid">
            <div className="now-art"><Artwork item={track} /></div>
            <div className="now-controls">
              <div className="now-meta"><div><h2>{track.title}</h2><p>{track.artist}</p></div><button type="button" className="round-button"><Glyph name="more" /></button></div>
              {error && <small className="error-message">{error}</small>}
              <div className="now-progress"><input type="range" min={0} max={duration || 1} step={0.01} value={Math.min(currentTime, duration || 1)} style={{ "--progress": `${progress * 100}%` } as CSSProperties} onChange={(event) => seek(Number(event.target.value))} /><div><span>{formatTime(currentTime)}</span><span>-{formatTime(Math.max(0, duration - currentTime))}</span></div></div>
              <div className="primary-controls"><button type="button"><Glyph name="previous" /></button><button type="button" className="play-control glass-surface" onClick={() => void togglePlaying()}><Glyph name={playing ? "pause" : "play"} /></button><button type="button"><Glyph name="next" /></button></div>
              <div className="volume-row"><Glyph name="volumeLow" /><input type="range" min={0} max={1} step={0.01} value={volume} onChange={(event) => setVolume(Number(event.target.value))} /><Glyph name="volumeHigh" /></div>
              <div className="secondary-controls"><button type="button" onClick={() => setOverlay("lyrics")}><Glyph name="lyrics" /><span>Lyrics</span></button><button type="button" onClick={() => setOverlay("queue")}><Glyph name="queue" /><span>Playing Next</span></button></div>
            </div>
          </div>
        </section>
      )}

      {overlay === "lyrics" && (
        <section className="full-overlay lyrics-overlay">
          <div className="player-backdrop"><BackgroundRender album={track.cover} playing={playing} staticMode={reducedMotion} fps={reducedMotion ? 1 : 45} /><div /></div>
          <header><button type="button" className="round-button glass-surface" onClick={() => setOverlay("player")}><Glyph name="down" /></button><span>LYRICS</span><button type="button" className="round-button glass-surface"><Glyph name="more" /></button></header>
          <div className="lyrics-layout">
            <aside className="lyrics-summary"><Artwork item={track} /><h2>{track.title}</h2><p>{track.artist}</p><div className="compact-controls"><button type="button"><Glyph name="previous" /></button><button type="button" onClick={() => void togglePlaying()}><Glyph name={playing ? "pause" : "play"} /></button><button type="button"><Glyph name="next" /></button></div></aside>
            <div className="lyrics-canvas"><LyricsView audioRef={audioRef} lyricLines={lyricLines} playing={playing} syncRef={syncLyricsRef} reducedMotion={reducedMotion} alignPosition={0.47} /></div>
          </div>
          <div className="lyrics-footer glass-surface"><Artwork item={track} /><div><strong>{track.title}</strong><span>{track.artist}</span></div><button type="button" onClick={() => void togglePlaying()}><Glyph name={playing ? "pause" : "play"} /></button><button type="button" onClick={() => setOverlay("queue")}><Glyph name="queue" /></button></div>
        </section>
      )}

      {overlay === "queue" && (
        <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay("player"); }}>
          <aside className="sheet queue-sheet glass-surface"><div className="sheet-handle" /><header><div><small>PLAYING NEXT</small><h2>Up Next</h2></div><button type="button" onClick={() => setOverlay("player")}>Done</button></header><div className="queue-current"><Artwork item={track} /><div><strong>{track.title}</strong><span>{track.artist}</span></div><span className="playing-bars"><i /><i /><i /></span></div><h3>Next</h3>{demoTracks.slice(1).map(([song, artist]) => <button type="button" className="queue-row" key={song}><div className="queue-placeholder">♫</div><div><strong>{song}</strong><span>{artist}</span></div><Glyph name="more" /></button>)}</aside>
        </div>
      )}

      {overlay === "account" && (
        <div className="modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) setOverlay(null); }}>
          <aside className="sheet account-sheet glass-surface"><div className="sheet-handle" /><header><h2>Account</h2><button type="button" onClick={() => setOverlay(null)}>Done</button></header><div className="account-identity"><span>K</span><div><strong>Kron</strong><small>Apple Music Subscriber</small></div></div>{["Manage Subscription", "Audio Quality", "Notifications", "Redeem Gift Card or Code", "Privacy & Settings"].map((label) => <button type="button" className="settings-row" key={label}><span>{label}</span><Glyph name="next" /></button>)}</aside>
        </div>
      )}

      <input ref={importInputRef} className="visually-hidden" type="file" multiple accept="audio/*,image/*,.lrc,.ttml,.dfxp" onChange={handleImport} />
      <audio ref={audioRef} preload="metadata" aria-label={`${track.title} audio`} />
    </main>
  );
}

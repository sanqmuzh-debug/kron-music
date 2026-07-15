import type { CSSProperties, ChangeEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEMO_AUDIO = "./demo/kron-midnight-demo.wav";
const DEFAULT_COVER = "https://images.squarespace-cdn.com/content/v1/5c871c710cf57df2b7235eab/04d5005f-1e59-41e3-8ccf-d6b659cbda7d/Office%2BLadies-%2BProfile%2BPic.jpg?format=1000w";
const PODCAST_TOTAL_SECONDS = 1 * 60 * 60 + 24 * 60 + 14;
const PODCAST_START_SECONDS = 1 * 60 * 60 + 3 * 60 + 4;

const transcript = [
  { time: 0, text: "Well, I know, I know." },
  {
    time: 4,
    text: "And I wanted to like just intentionally get rid of this card so they would issue me a new one. Now that's not my security code anymore.",
  },
  {
    time: 11,
    text: "But I imagine that's like layered because it's like, on the one hand, that's creepy. It's creepy. And then you have to say these creepy numbers.",
  },
  {
    time: 18,
    text: "But then you also now have Chitty Chat. When you just want to order your pizza, now that person's hearing it for the first time. So they're like, oh my God, that's weird.",
  },
  { time: 27, text: "Yeah, I know. Oh, are you going to change it? I'm going to try." },
  { time: 34, text: "But like over and over for two years." },
  { time: 39, text: "For two years." },
  {
    time: 44,
    text: "Well, then Dwight has a talking head. He says his first order of business will be to make the office feel secure.",
  },
  {
    time: 50,
    text: "And after that, he is going to review every single detail one more time.",
  },
];

const chapterOptions = [
  { label: "Cold Open", sublabel: "第5章（共8章）", progress: 0.08 },
  { label: "Dwight's Promotion & Creed Thoughts", sublabel: "第6章（共8章）", progress: 0.31 },
  { label: "Listener Questions", sublabel: "第7章（共8章）", progress: 0.72 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function activeTranscriptIndex(time: number) {
  let index = 0;
  for (let i = 0; i < transcript.length; i += 1) {
    if (time >= transcript[i].time) index = i;
    else break;
  }
  return index;
}

function PlaybackButton({
  label,
  children,
  className = "",
  onClick,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" aria-label={label} className={`playback-button ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function App() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(54);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.82);
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [panel, setPanel] = useState<"transcript" | "queue">("transcript");
  const [cover, setCover] = useState(DEFAULT_COVER);
  const [episodeTitle, setEpisodeTitle] = useState("Dwight's Promotion & Creed Thoughts —");
  const [showTitle, setShowTitle] = useState("Office Ladies");
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const activeIndex = useMemo(() => activeTranscriptIndex(currentTime), [currentTime]);
  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const displayElapsed = PODCAST_START_SECONDS + progress * (PODCAST_TOTAL_SECONDS - PODCAST_START_SECONDS);
  const displayRemaining = Math.max(0, PODCAST_TOTAL_SECONDS - displayElapsed);

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

    const syncTime = () => setCurrentTime(audio.currentTime || 0);
    const syncMetadata = () => setDuration(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 54);
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => {
      setPlaying(false);
      audio.currentTime = 0;
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncMetadata);
    audio.addEventListener("durationchange", syncMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncMetadata);
      audio.removeEventListener("durationchange", syncMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (panel !== "transcript") return;
    activeLineRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [activeIndex, panel, reducedMotion]);

  useEffect(() => () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const togglePlaying = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        // Browsers can block the first play request; a second user tap will retry.
      }
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((next: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const value = clamp(next, 0, audio.duration);
    audio.currentTime = value;
    setCurrentTime(value);
  }, []);

  const seekBy = useCallback((amount: number) => seek(currentTime + amount), [currentTime, seek]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 2];
    const index = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(index + 1) % rates.length]);
  }, [playbackRate]);

  const chooseChapter = useCallback(
    (index: number) => {
      setSelectedChapter(index);
      setChapterMenuOpen(false);
      seek((duration || 54) * chapterOptions[index].progress);
    },
    [duration, seek],
  );

  const seekToTranscript = useCallback(
    (time: number) => {
      seek(time);
      setPanel("transcript");
    },
    [seek],
  );

  const handleImport = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (!files.length) return;
      const audioFile = files.find((file) => file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name));
      const imageFile = files.find((file) => file.type.startsWith("image/"));
      if (audioFile && audioRef.current) {
        const audioUrl = URL.createObjectURL(audioFile);
        objectUrlsRef.current.push(audioUrl);
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        setCurrentTime(0);
        setEpisodeTitle(audioFile.name.replace(/\.[^.]+$/, ""));
        setShowTitle("Local Podcast");
      }
      if (imageFile) {
        const imageUrl = URL.createObjectURL(imageFile);
        objectUrlsRef.current.push(imageUrl);
        setCover(imageUrl);
      }
      event.target.value = "";
    },
    [],
  );

  return (
    <main className="desktop-scene">
      <div className="sky-glow" aria-hidden="true" />
      <div className="mountain-layer mountain-back" aria-hidden="true" />
      <div className="mountain-layer mountain-front" aria-hidden="true" />

      <div className="mac-menu-bar" aria-hidden="true">
        <div className="menu-left">
          <span className="apple-mark">●</span>
          <strong>播客</strong>
          <span>文件</span>
          <span>编辑</span>
          <span>显示</span>
          <span>控制</span>
          <span>账户</span>
          <span>窗口</span>
          <span>帮助</span>
        </div>
        <div className="menu-right">
          <span>⌁</span><span>◉</span><span>◐</span><span>⌁</span><span>⌕</span><span>43%</span><span>7月16日 周四 06:23</span>
        </div>
      </div>

      <section className="podcast-window" aria-label="Apple Podcasts transcript player">
        <div className="window-sheen" aria-hidden="true" />

        <div className="window-chrome">
          <div className="traffic-lights" aria-hidden="true">
            <span className="traffic red" />
            <span className="traffic yellow" />
            <span className="traffic green" />
            <button type="button" className="close-orb" aria-label="Close player">×</button>
          </div>

          <div className="output-control glass-control">
            <button type="button" aria-label="AirPlay" className="airplay-button">◉</button>
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              style={{ "--volume": `${volume * 100}%` } as CSSProperties}
            />
            <span className="speaker-mark" aria-hidden="true">◖)</span>
          </div>
        </div>

        <div className="podcast-layout">
          <section className="episode-panel">
            <button type="button" className="cover-button" onDoubleClick={() => importInputRef.current?.click()} aria-label="Import audio or artwork">
              <img src={cover} alt="Office Ladies podcast cover" onError={() => setCover("./cover.svg")} />
            </button>

            <div className="episode-copy">
              <time>2025年10月20日</time>
              <div className="episode-title-row">
                <h1>{episodeTitle}</h1>
                <button type="button" className="more-button" onClick={() => importInputRef.current?.click()} aria-label="More options">•••</button>
              </div>
              <p>{showTitle}</p>
            </div>

            <div className="progress-wrap">
              <input
                type="range"
                min={0}
                max={duration || 54}
                step={0.01}
                value={Math.min(currentTime, duration || 54)}
                onChange={(event) => seek(Number(event.target.value))}
                style={{ "--progress": `${progress * 100}%` } as CSSProperties}
                aria-label="Episode position"
              />
              <div className="progress-labels">
                <span>{formatClock(displayElapsed)}</span>
                <span>−{formatClock(displayRemaining)}</span>
              </div>
            </div>

            <div className="playback-controls">
              <PlaybackButton label="Playback speed" className="rate-button" onClick={cyclePlaybackRate}>
                {Number.isInteger(playbackRate) ? playbackRate : playbackRate.toFixed(2).replace(/0$/, "")}×
              </PlaybackButton>
              <PlaybackButton label="Back 15 seconds" onClick={() => seekBy(-15)}>
                <span className="skip-symbol">↶</span><span className="skip-number">15</span>
              </PlaybackButton>
              <PlaybackButton label={playing ? "Pause" : "Play"} className="main-play" onClick={togglePlaying}>
                {playing ? <span className="pause-glyph">Ⅱ</span> : <span className="play-glyph">▶︎</span>}
              </PlaybackButton>
              <PlaybackButton label="Forward 30 seconds" onClick={() => seekBy(30)}>
                <span className="skip-symbol">↷</span><span className="skip-number">30</span>
              </PlaybackButton>
              <PlaybackButton label="Sleep timer" className={sleepEnabled ? "active" : ""} onClick={() => setSleepEnabled((value) => !value)}>
                <span className="sleep-glyph">☾</span><span className="sleep-z">ᶻ</span>
              </PlaybackButton>
            </div>
          </section>

          <section className="transcript-panel">
            <div className="chapter-area">
              <button type="button" className="chapter-card glass-control" onClick={() => setChapterMenuOpen((value) => !value)} aria-expanded={chapterMenuOpen}>
                <span>
                  <strong>{chapterOptions[selectedChapter].label}</strong>
                  <small>{chapterOptions[selectedChapter].sublabel}</small>
                </span>
                <span className={`chapter-chevron ${chapterMenuOpen ? "open" : ""}`}>⌄</span>
              </button>
              {chapterMenuOpen && (
                <div className="chapter-popover glass-control">
                  {chapterOptions.map((chapter, index) => (
                    <button type="button" key={chapter.label} className={index === selectedChapter ? "selected" : ""} onClick={() => chooseChapter(index)}>
                      <strong>{chapter.label}</strong>
                      <small>{chapter.sublabel}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {panel === "transcript" ? (
              <div className="transcript-scroll" ref={transcriptRef}>
                <div className="transcript-spacer" aria-hidden="true" />
                {transcript.map((line, index) => (
                  <button
                    type="button"
                    key={`${line.time}-${line.text}`}
                    ref={index === activeIndex ? activeLineRef : undefined}
                    className={`transcript-line ${index === activeIndex ? "active" : ""} ${index < activeIndex ? "past" : "future"}`}
                    onClick={() => seekToTranscript(line.time)}
                  >
                    {line.text}
                  </button>
                ))}
                <div className="transcript-tail" aria-hidden="true" />
              </div>
            ) : (
              <div className="queue-panel">
                <div className="queue-heading">
                  <strong>Playing Next</strong>
                  <span>Autoplay</span>
                </div>
                {chapterOptions.map((chapter, index) => (
                  <button type="button" key={chapter.label} onClick={() => chooseChapter(index)}>
                    <span>{index + 5}</span>
                    <div>
                      <strong>{chapter.label}</strong>
                      <small>{chapter.sublabel}</small>
                    </div>
                    <span>•••</span>
                  </button>
                ))}
              </div>
            )}

            <div className="view-switch glass-control" role="group" aria-label="Transcript or queue">
              <button type="button" className={panel === "transcript" ? "active" : ""} onClick={() => setPanel("transcript")} aria-label="Transcript">
                <span className="bubble-glyph">▣</span>
              </button>
              <button type="button" className={panel === "queue" ? "active" : ""} onClick={() => setPanel("queue")} aria-label="Queue">
                <span className="queue-glyph">≡</span>
              </button>
            </div>
          </section>
        </div>

        <input ref={importInputRef} type="file" className="visually-hidden" accept="audio/*,image/*" multiple onChange={handleImport} />
        <audio ref={audioRef} src={DEMO_AUDIO} preload="metadata" />
      </section>
    </main>
  );
}

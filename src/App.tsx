import type { CSSProperties, ChangeEvent, ReactNode, SVGProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEMO_AUDIO = "./demo/kron-midnight-demo.wav";
const DEFAULT_COVER =
  "https://images.squarespace-cdn.com/content/v1/5c871c710cf57df2b7235eab/04d5005f-1e59-41e3-8ccf-d6b659cbda7d/Office%2BLadies-%2BProfile%2BPic.jpg?format=1000w";
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

type IconProps = SVGProps<SVGSVGElement>;

function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 38 38" aria-hidden="true" {...props}>
      <path d="M5.80762 32.4896V5.4925C5.80762 4.305 6.12305 3.41438 6.75391 2.82063C7.38477 2.22688 8.13932 1.93 9.01758 1.93C9.78451 1.93 10.5391 2.14029 11.2812 2.56086L33.7324 15.6605C34.5859 16.1553 35.223 16.6562 35.6436 17.1634C36.0641 17.6582 36.2744 18.2705 36.2744 19.0003C36.2744 19.7054 36.0641 20.3177 35.6436 20.8372C35.223 21.3444 34.5859 21.8392 33.7324 22.3216L11.2812 35.4212C10.5391 35.8542 9.78451 36.0706 9.01758 36.0706C8.13932 36.0706 7.38477 35.7676 6.75391 35.1614C6.12305 34.5677 5.80762 33.6771 5.80762 32.4896Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 38 38" aria-hidden="true" {...props}>
      <path d="M8.46953 37C7.37801 37 6.56603 36.7271 6.03359 36.1814C5.51445 35.6489 5.25488 34.8502 5.25488 33.7854V4.21464C5.25488 3.14975 5.52111 2.35108 6.05355 1.81864C6.59931 1.27288 7.40463 1 8.46953 1H13.3813C14.4329 1 15.2249 1.27288 15.7574 1.81864C16.3031 2.35108 16.576 3.14975 16.576 4.21464V33.7854C16.576 34.8502 16.3031 35.6489 15.7574 36.1814C15.2249 36.7271 14.4329 37 13.3813 37H8.46953ZM24.6426 37C23.5644 37 22.759 36.7271 22.2266 36.1814C21.6942 35.6489 21.4279 34.8502 21.4279 33.7854V4.21464C21.4279 3.14975 21.6942 2.35108 22.2266 1.81864C22.7724 1.27288 23.5777 1 24.6426 1H29.5544C30.6193 1 31.4179 1.27288 31.9504 1.81864C32.4828 2.35108 32.7491 3.14975 32.7491 4.21464V33.7854C32.7491 34.8502 32.4828 35.6489 31.9504 36.1814C31.4179 36.7271 30.6193 37 29.5544 37H24.6426Z" fill="currentColor" />
    </svg>
  );
}

function SkipIcon({ seconds, direction, ...props }: IconProps & { seconds: 15 | 30; direction: "back" | "forward" }) {
  const forward = direction === "forward";
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" {...props}>
      <path
        d={forward ? "M12.2 13.2A15 15 0 1 1 9.8 28" : "M31.8 13.2A15 15 0 1 0 34.2 28"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
      <path
        d={forward ? "M11.4 7.8v6.8h6.8" : "M32.6 7.8v6.8h-6.8"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="22" y="27" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif" fontSize="10.6" fontWeight="750" fill="currentColor">
        {seconds}
      </text>
    </svg>
  );
}

function AirPlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path d="M8.5 26.6a15.5 15.5 0 1 1 31 0" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M14.4 26.6a9.6 9.6 0 1 1 19.2 0" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M20.2 26.6a3.8 3.8 0 1 1 7.6 0" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M24 27.5 13.8 39.4h20.4L24 27.5Z" fill="currentColor" />
    </svg>
  );
}

function SpeakerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <path d="M4.8 13h5l6.2-5.1v16.2L9.8 19h-5Z" fill="currentColor" />
      <path d="M20.1 11.2a7 7 0 0 1 0 9.6M23.8 7.6a12 12 0 0 1 0 16.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="8" cy="16" r="2.2" fill="currentColor" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
      <circle cx="24" cy="16" r="2.2" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m6.5 9 5.5 5.5L17.5 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SleepIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path d="M24.7 25.7A11.3 11.3 0 0 1 10.3 11.3a12.3 12.3 0 1 0 14.4 14.4Z" fill="currentColor" />
      <path d="M24.2 8.1h5.3l-5.3 5.7h5.3M27.6 3.8h3.8l-3.8 4.1h3.8" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TranscriptIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path d="M7.5 7h21A4.5 4.5 0 0 1 33 11.5v12a4.5 4.5 0 0 1-4.5 4.5H18l-7 5v-5H7.5A4.5 4.5 0 0 1 3 23.5v-12A4.5 4.5 0 0 1 7.5 7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.3 15.1h5.4v5.4h-5.4zM19.3 15.1h5.4v5.4h-5.4z" fill="currentColor" />
    </svg>
  );
}

function QueueIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <path d="M13 10h18M13 18h18M13 26h18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="6" cy="10" r="1.8" fill="currentColor" />
      <circle cx="6" cy="18" r="1.8" fill="currentColor" />
      <circle cx="6" cy="26" r="1.8" fill="currentColor" />
    </svg>
  );
}

function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="m6.7 6.7 10.6 10.6M17.3 6.7 6.7 17.3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

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
    activeLineRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  }, [activeIndex, panel, reducedMotion]);

  useEffect(() => () => objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const togglePlaying = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        // User gesture retry is handled by the next tap.
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

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  return (
    <main className="podcast-stage">
      <section className="podcast-window" aria-label="Apple Podcasts transcript player">
        <div className="window-sheen" aria-hidden="true" />

        <header className="window-toolbar">
          <button type="button" className="close-button glass-control" aria-label="Close player">
            <CloseIcon />
          </button>

          <div className="output-control glass-control">
            <button type="button" aria-label="AirPlay" className="airplay-button">
              <AirPlayIcon />
            </button>
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
            <SpeakerIcon className="speaker-icon" />
          </div>
        </header>

        <div className="podcast-layout">
          <section className="episode-panel">
            <button type="button" className="cover-button" onDoubleClick={() => importInputRef.current?.click()} aria-label="Import audio or artwork">
              <img src={cover} alt="Office Ladies podcast cover" onError={() => setCover("./cover.svg")} />
            </button>

            <div className="episode-copy">
              <time>2025年10月20日</time>
              <div className="episode-title-row">
                <h1>{episodeTitle}</h1>
                <button type="button" className="more-button" onClick={() => importInputRef.current?.click()} aria-label="More options">
                  <MoreIcon />
                </button>
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
                <SkipIcon seconds={15} direction="back" />
              </PlaybackButton>
              <PlaybackButton label={playing ? "Pause" : "Play"} className="main-play" onClick={togglePlaying}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </PlaybackButton>
              <PlaybackButton label="Forward 30 seconds" onClick={() => seekBy(30)}>
                <SkipIcon seconds={30} direction="forward" />
              </PlaybackButton>
              <PlaybackButton label="Sleep timer" className={sleepEnabled ? "active" : ""} onClick={() => setSleepEnabled((value) => !value)}>
                <SleepIcon />
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
                <ChevronIcon className={chapterMenuOpen ? "open" : ""} />
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
              <div className="transcript-scroll">
                <div className="transcript-spacer" aria-hidden="true" />
                {transcript.map((line, index) => (
                  <button
                    type="button"
                    key={`${line.time}-${line.text}`}
                    ref={index === activeIndex ? activeLineRef : undefined}
                    className={`transcript-line ${index === activeIndex ? "active" : ""} ${index < activeIndex ? "past" : "future"}`}
                    onClick={() => seek(line.time)}
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
                    <MoreIcon />
                  </button>
                ))}
              </div>
            )}

            <div className="view-switch glass-control" role="group" aria-label="Transcript or queue">
              <button type="button" className={panel === "transcript" ? "active" : ""} onClick={() => setPanel("transcript")} aria-label="Transcript">
                <TranscriptIcon />
              </button>
              <button type="button" className={panel === "queue" ? "active" : ""} onClick={() => setPanel("queue")} aria-label="Queue">
                <QueueIcon />
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

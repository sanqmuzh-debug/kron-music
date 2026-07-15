# Kron Music

Apple Music-inspired full-screen lyric player built on the mature [Apple Music-like Lyrics (AMLL)](https://github.com/amll-dev/applemusic-like-lyrics) rendering stack.

## What is included

- AMLL synchronized lyric renderer and fluid album-art background
- Real `HTMLAudioElement` playback clock with play, pause, seek, skip, ended and queue handling
- AMLL's imperative `setCurrentTime` / `update` loop, with spring, blur and scale lyric motion
- Full-screen desktop layout matching the supplied Apple Music references
- Responsive mobile layout
- Seek bar, play/pause, skip controls and previous/next imported tracks
- Local multi-file import for audio, LRC/TTML lyrics and cover art
- URL parameters: `music`, `lyric`, `cover`, `title`, `artist`
- Auto-hiding player chrome and ambient background pulse

The repository includes a generated public-domain WAV tone, an LRC file and the existing SVG cover in `public/demo` for local testing. The audio is intentionally synthetic so the repository does not redistribute a commercial recording.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The workflow publishes the compiled site to the `gh-pages` branch. A repository-file preview can then be opened through RawGitHack:

`https://raw.githack.com/sanqmuzh-debug/kron-music/gh-pages/index.html`

## License note

AMLL is licensed under AGPL-3.0-only. Review its license requirements before production distribution.

<!-- preview-ci -->

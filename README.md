# Kron Music

Apple Music-inspired full-screen lyric player built on the mature [Apple Music-like Lyrics (AMLL)](https://github.com/amll-dev/applemusic-like-lyrics) rendering stack.

## What is included

- AMLL synchronized lyric renderer and fluid album-art background
- 60fps `requestAnimationFrame` playback clock for the demo
- Full-screen desktop layout matching the supplied Apple Music references
- Responsive mobile layout
- Seek bar, play/pause and skip controls
- Auto-hiding player chrome and ambient background pulse

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

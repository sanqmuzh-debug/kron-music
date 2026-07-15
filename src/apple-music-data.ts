export type CatalogItem = {
  id: string;
  title: string;
  subtitle: string;
  art: string;
  eyebrow?: string;
  kind?: "album" | "playlist" | "station";
};

export const recentlyPlayed: CatalogItem[] = [
  { id: "midnight", title: "Midnight Tide", subtitle: "Kron", art: "art-ocean", kind: "album" },
  { id: "afterglow", title: "Afterglow", subtitle: "Kron", art: "art-sunset", kind: "album" },
  { id: "blue-hour", title: "Blue Hour", subtitle: "Kron Radio", art: "art-blue", kind: "station" },
  { id: "night-drive", title: "Night Drive", subtitle: "Made for Kron", art: "art-red", kind: "playlist" },
  { id: "soft-focus", title: "Soft Focus", subtitle: "Apple Music Chill", art: "art-soft", kind: "playlist" },
  { id: "signal", title: "Signal", subtitle: "Kron", art: "art-purple", kind: "album" },
];

export const madeForYou: CatalogItem[] = [
  { id: "replay", title: "Replay 2026", subtitle: "Your top songs", art: "art-replay", eyebrow: "MADE FOR KRON", kind: "playlist" },
  { id: "favorites", title: "Favorites Mix", subtitle: "Updated Tuesday", art: "art-favorite", eyebrow: "MADE FOR KRON", kind: "playlist" },
  { id: "discovery", title: "Discovery Station", subtitle: "Your personal station", art: "art-discovery", eyebrow: "STATION", kind: "station" },
  { id: "chill", title: "Chill Mix", subtitle: "Updated Sunday", art: "art-chill", eyebrow: "MADE FOR KRON", kind: "playlist" },
];

export const newReleases: CatalogItem[] = [
  { id: "glass", title: "Glass Horizon", subtitle: "Nova", art: "art-glass", kind: "album" },
  { id: "violet", title: "Violet Static", subtitle: "Mira Lane", art: "art-violet", kind: "album" },
  { id: "cities", title: "Cities at 4 AM", subtitle: "Lowlight", art: "art-city", kind: "album" },
  { id: "solace", title: "Solace", subtitle: "Aster", art: "art-solace", kind: "album" },
  { id: "parallel", title: "Parallel", subtitle: "June Atlas", art: "art-parallel", kind: "album" },
];

export const radioStations: CatalogItem[] = [
  { id: "one", title: "Apple Music 1", subtitle: "The new music that matters", art: "art-radio-one", eyebrow: "LIVE", kind: "station" },
  { id: "hits", title: "Apple Music Hits", subtitle: "Songs you know and love", art: "art-radio-hits", eyebrow: "LIVE", kind: "station" },
  { id: "country", title: "Apple Music Country", subtitle: "Where it sounds like home", art: "art-radio-country", eyebrow: "LIVE", kind: "station" },
  { id: "club", title: "Apple Music Club", subtitle: "Dance around the clock", art: "art-radio-club", eyebrow: "LIVE", kind: "station" },
];

export const browseCategories = [
  ["Spatial Audio", "category-spatial"],
  ["Pop", "category-pop"],
  ["Hip-Hop", "category-hiphop"],
  ["Chill", "category-chill"],
  ["Electronic", "category-electronic"],
  ["Alternative", "category-alt"],
  ["R&B", "category-rnb"],
  ["Jazz", "category-jazz"],
  ["Classical", "category-classical"],
  ["Fitness", "category-fitness"],
] as const;

export const librarySections = [
  ["Playlists", "list.bullet"],
  ["Artists", "music.mic"],
  ["Albums", "square.stack"],
  ["Songs", "music.note"],
  ["Made for You", "person.crop.square"],
  ["Downloaded", "arrow.down.circle"],
] as const;

export const demoTracks = [
  ["Breathe in, let the midnight settle", "Kron", "0:54"],
  ["Blue light moving slow across the room", "Kron", "0:54"],
  ["Every little wave becomes a signal", "Kron", "0:54"],
  ["Every quiet second pulls me through", "Kron", "0:54"],
  ["Stay here while the city turns to water", "Kron", "0:54"],
  ["Open arms, no hurry, no tomorrow", "Kron", "0:54"],
] as const;

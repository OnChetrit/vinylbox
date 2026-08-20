import type { RecordItem } from "@/types/record";
import { mockRecords } from "./mockData";

const DISCOGS_API = "https://api.discogs.com/database/search";
const DISCOGS_RELEASE = "https://api.discogs.com/releases";

export type DiscogsSearchOptions = {
  genre?: string;
  style?: string;
  year?: string;
  sort?: "year" | "title" | "artist" | "format" | "label" | "catno" | "genre" | "style" | "country";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
};

export type DiscogsSearchResponse = {
  results: RecordItem[];
  page: number;
  pages: number;
  perPage: number;
  total: number;
};

type DiscogsSearchResult = {
  id: number;
  title: string;
  year?: number;
  cover_image?: string;
  genre?: string[];
  style?: string[];
};

type DiscogsRelease = {
  id: number;
  title: string;
  artists?: { name: string }[];
  year?: number;
  genres?: string[];
  styles?: string[];
  country?: string;
  labels?: { name: string }[];
  formats?: { name: string; descriptions?: string[] }[];
  images?: { uri: string }[];
  tracklist?: { title: string; duration?: string }[];
  notes?: string;
};

function mapResult(result: DiscogsSearchResult): RecordItem {
  const [artist, title] = result.title.split(" - ");

  return {
    id: result.id.toString(),
    title: title ?? result.title,
    artist: artist ?? "Unknown artist",
    year: result.year ? result.year.toString() : undefined,
    genre: result.genre?.[0],
    style: result.style?.[0],
    coverUrl: result.cover_image,
  };
}

function mapRelease(release: DiscogsRelease): RecordItem {
  return {
    id: release.id.toString(),
    title: release.title,
    artist: release.artists?.[0]?.name ?? "Unknown artist",
    year: release.year ? String(release.year) : undefined,
    genre: release.genres?.[0],
    style: release.styles?.[0],
    country: release.country,
    labels: release.labels?.map((l) => l.name),
    formats: release.formats?.map((f) =>
      f.descriptions?.length ? `${f.name} (${f.descriptions.join(", ")})` : f.name,
    ),
    coverUrl: release.images?.[0]?.uri,
    description: release.notes ?? undefined,
    tracklist: release.tracklist?.map((t) => t.title).filter(Boolean),
  };
}

export async function searchVinyls(
  query: string,
  options: DiscogsSearchOptions = {},
): Promise<DiscogsSearchResponse> {
  if (!query) return { results: [], page: 1, pages: 0, perPage: options.perPage ?? 18, total: 0 };

  const token = process.env.DISCOGS_TOKEN;

  if (!token) {
    console.warn("DISCOGS_TOKEN is missing. Falling back to mock data.");
    const results = mockRecords.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.artist.toLowerCase().includes(query.toLowerCase()),
    );
    const perPage = options.perPage ?? 18;
    const page = options.page ?? 1;

    return {
      results: results.slice((page - 1) * perPage, page * perPage),
      page,
      pages: Math.ceil(results.length / perPage),
      perPage,
      total: results.length,
    };
  }

  const searchParams = new URLSearchParams({
    q: query,
    format: "vinyl",
    per_page: String(options.perPage ?? 18),
    page: String(options.page ?? 1),
    type: "release",
  });

  if (options.genre) searchParams.set("genre", options.genre);
  if (options.style) searchParams.set("style", options.style);
  if (options.year) searchParams.set("year", options.year);
  if (options.sort) searchParams.set("sort", options.sort);
  if (options.sortOrder) searchParams.set("sort_order", options.sortOrder);

  const response = await fetch(`${DISCOGS_API}?${searchParams.toString()}`, {
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "vinylbox/1.0 +https://github.com/",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    console.error("Discogs search failed", await response.text());
    return {
      results: mockRecords,
      page: options.page ?? 1,
      pages: 1,
      perPage: options.perPage ?? 18,
      total: mockRecords.length,
    };
  }

  const data = await response.json();
  const results: DiscogsSearchResult[] = data.results ?? [];
  return {
    results: results.map(mapResult),
    page: data.pagination?.page ?? options.page ?? 1,
    pages: data.pagination?.pages ?? 1,
    perPage: data.pagination?.per_page ?? options.perPage ?? 18,
    total: data.pagination?.items ?? results.length,
  };
}

export async function fetchRecommendations(
  seed: string | undefined = "classic vinyl",
): Promise<RecordItem[]> {
  const { results } = await searchVinyls(seed);
  if (results.length) return results.slice(0, 12);
  return mockRecords;
}

export async function fetchRelease(discogsId: string): Promise<RecordItem | null> {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) return null;

  const response = await fetch(`${DISCOGS_RELEASE}/${discogsId}`, {
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "vinylbox/1.0 +https://github.com/",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    console.error("Discogs release fetch failed", await response.text());
    return null;
  }

  const data: DiscogsRelease = await response.json();
  return mapRelease(data);
}

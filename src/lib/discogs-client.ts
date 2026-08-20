import type { RecordItem } from "@/types/record";

const DISCOGS_API = "https://api.discogs.com";

export type DiscogsIdentity = {
  username: string;
  avatarUrl?: string;
};

type DiscogsRelease = {
  id: number;
  master_id?: number;
  title: string;
  year?: number;
  artists?: { name: string }[];
  genres?: string[];
  styles?: string[];
  cover_image?: string;
  thumb?: string;
  images?: { uri: string }[];
  labels?: { name: string }[];
  formats?: { name: string; descriptions?: string[] }[];
};

type CollectionEntry = {
  instance_id: number;
  folder_id: number;
  basic_information: DiscogsRelease;
};

async function request<T>(token: string, path: string, options?: { method?: "PUT" | "DELETE"; params?: Record<string, string> }) {
  const query = new URLSearchParams(options?.params);
  const response = await fetch(`${DISCOGS_API}${path}?${query.toString()}`, {
    method: options?.method ?? "GET",
    headers: { Authorization: `Discogs token=${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    throw new Error(body?.message ?? body?.error ?? "Discogs could not complete that request.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function cleanArtist(name: string) {
  return name.replace(/\s*\(\d+\)$/, "");
}

function toRecord(release: DiscogsRelease, instance?: CollectionEntry): RecordItem {
  const titleParts = release.title.split(" - ");
  const hasArtistPrefix = !release.artists?.length && titleParts.length > 1;
  return {
    id: String(release.id),
    masterId: release.master_id ? String(release.master_id) : undefined,
    instanceId: instance ? String(instance.instance_id) : undefined,
    folderId: instance?.folder_id,
    title: hasArtistPrefix ? titleParts.slice(1).join(" - ") : release.title,
    artist: release.artists?.map((artist) => cleanArtist(artist.name)).join(", ") ?? (hasArtistPrefix ? titleParts[0] : "Unknown artist"),
    year: release.year ? String(release.year) : undefined,
    genre: release.genres?.[0],
    style: release.styles?.[0],
    labels: release.labels?.map((label) => label.name),
    formats: release.formats?.map((format) => format.descriptions?.length ? `${format.name} · ${format.descriptions.join(", ")}` : format.name),
    coverUrl: release.cover_image ?? release.images?.[0]?.uri ?? release.thumb,
  };
}

export async function getIdentity(token: string): Promise<DiscogsIdentity> {
  const identity = await request<{ username: string; avatar_url?: string }>(token, "/oauth/identity");
  return { username: identity.username, avatarUrl: identity.avatar_url };
}

export async function getCollection(token: string, username: string): Promise<RecordItem[]> {
  const first = await request<{ releases?: CollectionEntry[]; pagination?: { pages?: number } }>(
    token,
    `/users/${encodeURIComponent(username)}/collection/folders/0/releases`,
    { params: { per_page: "100", page: "1" } },
  );
  const pages = Math.min(first.pagination?.pages ?? 1, 20);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      request<{ releases?: CollectionEntry[] }>(
        token,
        `/users/${encodeURIComponent(username)}/collection/folders/0/releases`,
        { params: { per_page: "100", page: String(index + 2) } },
      ),
    ),
  );

  return [first, ...rest]
    .flatMap((page) => page.releases ?? [])
    .map((entry) => toRecord(entry.basic_information, entry));
}

export async function searchDiscogs(token: string, query: string): Promise<RecordItem[]> {
  const data = await request<{ results?: DiscogsRelease[] }>(token, "/database/search", {
    params: { q: query, type: "release", format: "vinyl", per_page: "24" },
  });
  return (data.results ?? []).map((release) => toRecord(release));
}

export async function getOriginalReleaseYear(token: string, masterId: string) {
  const master = await request<{ year?: number }>(token, `/masters/${masterId}`);
  return master.year ? String(master.year) : undefined;
}

export async function addToCollection(token: string, username: string, releaseId: string) {
  const folders = await request<{ folders?: { id: number; name: string }[] }>(
    token,
    `/users/${encodeURIComponent(username)}/collection/folders`,
  );
  const destination = folders.folders?.find((folder) => folder.name.toLowerCase() === "uncategorized") ?? folders.folders?.[0];
  if (!destination) throw new Error("No Discogs collection folder is available for this account.");
  await request(token, `/users/${encodeURIComponent(username)}/collection/folders/${destination.id}/releases/${releaseId}`, { method: "PUT" });
}

export async function removeFromCollection(token: string, username: string, record: RecordItem) {
  if (!record.instanceId || record.folderId === undefined) {
    throw new Error("This record needs to be refreshed before it can be removed.");
  }
  await request(
    token,
    `/users/${encodeURIComponent(username)}/collection/folders/${record.folderId}/releases/${record.id}/instances/${record.instanceId}`,
    { method: "DELETE" },
  );
}

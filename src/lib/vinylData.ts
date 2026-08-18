import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecordItem } from "@/types/record";
import { mockRecords } from "./mockData";

const COLLECTION_TABLE = "collection_items";
const WISHLIST_TABLE = "wishlist_items";

type VinylRow = {
  id?: string | number | null;
  record_id?: string | null;
  title: string;
  artist: string;
  year?: string | number | null;
  genre?: string | null;
  style?: string | null;
  cover_url?: string | null;
  notes?: string | null;
};

export async function fetchCollection(
  supabase: SupabaseClient,
  userId: string,
): Promise<RecordItem[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from(COLLECTION_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching collection", error);
    return mockRecords.slice(0, 4);
  }

  return data.map(mapRow);
}

export async function fetchWishlist(
  supabase: SupabaseClient,
  userId: string,
): Promise<RecordItem[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from(WISHLIST_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist", error);
    return mockRecords.slice(2, 6);
  }

  return data.map(mapRow);
}

export async function upsertCollectionItem(
  supabase: SupabaseClient,
  userId: string,
  record: RecordItem,
) {
  return supabase.from(COLLECTION_TABLE).upsert({
    user_id: userId,
    record_id: record.id,
    title: record.title,
    artist: record.artist,
    year: record.year,
    genre: record.genre,
    style: record.style,
    cover_url: record.coverUrl,
  });
}

export async function upsertWishlistItem(
  supabase: SupabaseClient,
  userId: string,
  record: RecordItem,
) {
  return supabase.from(WISHLIST_TABLE).upsert({
    user_id: userId,
    record_id: record.id,
    title: record.title,
    artist: record.artist,
    year: record.year,
    genre: record.genre,
    style: record.style,
    cover_url: record.coverUrl,
  });
}

export async function removeCollectionItem(
  supabase: SupabaseClient,
  userId: string,
  recordId: string,
) {
  return supabase
    .from(COLLECTION_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("record_id", recordId);
}

export async function removeWishlistItem(
  supabase: SupabaseClient,
  userId: string,
  recordId: string,
) {
  return supabase
    .from(WISHLIST_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("record_id", recordId);
}

function mapRow(row: VinylRow): RecordItem {
  return {
    id:
      row.record_id ??
      row.id?.toString() ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)),
    title: row.title,
    artist: row.artist,
    year: row.year ? String(row.year) : undefined,
    genre: row.genre ?? undefined,
    style: row.style ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    notes: row.notes ?? undefined,
  };
}


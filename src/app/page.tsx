"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGate from "@/components/auth/AuthGate";
import PageHeader from "@/components/ui/PageHeader";
import RecordGrid from "@/components/ui/RecordGrid";
import { RecordSkeletonGrid } from "@/components/ui/RecordSkeleton";
import SearchBar from "@/components/ui/SearchBar";
import RecordModal from "@/components/ui/RecordModal";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  fetchCollection,
  fetchWishlist,
  upsertCollectionItem,
  upsertWishlistItem,
} from "@/lib/vinylData";
import { fetchRelease } from "@/lib/discogs";
import type { RecordItem } from "@/types/record";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase, session } = useSupabase();
  const [recommendations, setRecommendations] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<RecordItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [primaryPending, setPrimaryPending] = useState<Set<string>>(new Set());
  const [secondaryPending, setSecondaryPending] = useState<Set<string>>(
    new Set(),
  );
  const [collectionIds, setCollectionIds] = useState<Set<string>>(new Set());
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    genre: "",
    style: "",
    year: "",
    sort: "",
    sortOrder: "desc",
  });
  const [modalState, setModalState] = useState<{
    record: RecordItem;
    originRect: DOMRect;
  } | null>(null);

  useEffect(() => {
    if (!session) return;
    const loadListsAndRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const [collection, wishlist] = await Promise.all([
          fetchCollection(supabase, session.user.id),
          fetchWishlist(supabase, session.user.id),
        ]);
        setCollectionIds(new Set(collection.map((r) => r.id)));
        setWishlistIds(new Set(wishlist.map((r) => r.id)));

        const genreCounts = collection.reduce<Record<string, number>>((acc, item) => {
          if (item.genre) acc[item.genre] = (acc[item.genre] ?? 0) + 1;
          return acc;
        }, {});
        const artistCounts = collection.reduce<Record<string, number>>((acc, item) => {
          if (item.artist) acc[item.artist] = (acc[item.artist] ?? 0) + 1;
          return acc;
        }, {});
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const seed = [topArtist, topGenre].filter(Boolean).join(" ") || "classic vinyl";
        const res = await fetch(`/api/recommendations?seed=${encodeURIComponent(seed)}`);
        const json = await res.json();
        setRecommendations(json.results ?? []);
      } catch (err) {
        console.error(err);
        setError("Could not load recommendations.");
      } finally {
        setLoading(false);
      }
    };

    loadListsAndRecs();
  }, [session, supabase]);

  const enrich = async (record: RecordItem) =>
    (await fetchRelease(record.id)) ?? record;

  const runSearch = useCallback(
    async (query: string, page: number, nextFilters: typeof filters) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        setSearchQuery("");
        setSearchPage(1);
        setSearchTotalPages(1);
        return;
      }
      setSearchLoading(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({ query: trimmed });
        if (nextFilters.genre) params.set("genre", nextFilters.genre);
        if (nextFilters.style) params.set("style", nextFilters.style);
        if (nextFilters.year) params.set("year", nextFilters.year);
        if (nextFilters.sort) params.set("sort", nextFilters.sort);
        if (nextFilters.sortOrder) params.set("sortOrder", nextFilters.sortOrder);
        params.set("page", String(page));
        params.set("perPage", "18");

        const res = await fetch(`/api/search?${params.toString()}`);
        const json = await res.json();
        setSearchResults(json.results ?? []);
        setSearchTotalPages(json.pages ?? 1);
        setSearchPage(json.page ?? page);
        setSearchQuery(trimmed);
      } catch (err) {
        console.error(err);
        setSearchError("Search failed. Check your Discogs token.");
      } finally {
        setSearchLoading(false);
      }
    },
    [], // function does not depend on component state; uses passed-in filters
  );

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    const qp = searchParams.get("query") ?? "";
    const genre = searchParams.get("genre") ?? "";
    const style = searchParams.get("style") ?? "";
    const year = searchParams.get("year") ?? "";
    const sort = searchParams.get("sort") ?? "";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const page = Number(searchParams.get("page") ?? "1");

    const nextFilters = { genre, style, year, sort, sortOrder };

    setFilters((prev) => {
      const same =
        prev.genre === genre &&
        prev.style === style &&
        prev.year === year &&
        prev.sort === sort &&
        prev.sortOrder === sortOrder;
      return same ? prev : nextFilters;
    });

    setSearchQuery((prev) => (prev === qp ? prev : qp));
    setSearchPage((prev) => (prev === page ? prev : page));

    if (qp.trim()) {
      runSearch(qp, page, nextFilters);
    } else {
      setSearchResults([]);
      setSearchTotalPages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey, runSearch]);

  const handleAddCollection = async (record: RecordItem) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setPrimaryPending((prev) => new Set(prev).add(record.id));
    const detailed = await enrich(record);
    await upsertCollectionItem(supabase, session.user.id, detailed);
    setCollectionIds((prev) => new Set(prev).add(record.id));
    setPrimaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  const handleWishlist = async (record: RecordItem) => {
    if (!session) {
      router.push("/login");
      return;
    }
    setSecondaryPending((prev) => new Set(prev).add(record.id));
    const detailed = await enrich(record);
    await upsertWishlistItem(supabase, session.user.id, detailed);
    setWishlistIds((prev) => new Set(prev).add(record.id));
    setSecondaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchQuery("");
      setSearchPage(1);
      setSearchTotalPages(1);
      return;
    }
    const params = new URLSearchParams();
    params.set("query", trimmed);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.style) params.set("style", filters.style);
    if (filters.year) params.set("year", filters.year);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    params.set("page", "1");
    router.replace(`/?${params.toString()}`);
  };

  return (
    <AuthGate>
      <div className="section">
        <PageHeader
          title="Your curated vinyl box"
          description="Discover new pressings, track your shelves, and save wants in one place."
          chips={["Collection", "Wishlist", "Recommendations"]}
          rightSlot={<div className="pill">Signed in</div>}
        />

        <SearchBar
          placeholder="Try “Blue Note”, “Radiohead”, or a catalog number…"
          onSearch={handleSearch}
        />
        <div className="filters">
          <input
            placeholder="Genre"
            value={filters.genre}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
          />
          <input
            placeholder="Style"
            value={filters.style}
            onChange={(e) => setFilters((f) => ({ ...f, style: e.target.value }))}
          />
          <input
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
          />
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          >
            <option value="">Sort: relevance</option>
            <option value="year">Year</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value }))}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        {searchLoading ? (
          <div style={{ marginTop: 16 }}>
            <RecordSkeletonGrid count={6} />
          </div>
        ) : searchError ? (
          <p className="muted" style={{ marginTop: 12 }}>
            {searchError}
          </p>
        ) : searchQuery ? (
          <div style={{ marginTop: 16 }}>
            <PageHeader
              title="Search results"
              description={`Results for "${searchQuery}"`}
            />
            <RecordGrid
              records={searchResults}
              emptyMessage="No results yet. Try another query."
              actionLabel="Add to collection"
              onAction={handleAddCollection}
              secondaryActionLabel="Wishlist"
              onSecondaryAction={handleWishlist}
              primaryLoadingIds={primaryPending}
              secondaryLoadingIds={secondaryPending}
              collectionIds={collectionIds}
              wishlistIds={wishlistIds}
            onSelect={(record, rect) => setModalState({ record, originRect: rect })}
              className="fancy-grid"
            />
            <div className="pager">
              <button
                className="pill"
                type="button"
                disabled={searchPage <= 1 || searchLoading}
                onClick={() => {
                  const nextPage = Math.max(1, searchPage - 1);
                  const params = new URLSearchParams({
                    query: searchQuery,
                    page: String(nextPage),
                  });
                  if (filters.genre) params.set("genre", filters.genre);
                  if (filters.style) params.set("style", filters.style);
                  if (filters.year) params.set("year", filters.year);
                  if (filters.sort) params.set("sort", filters.sort);
                  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
                  router.replace(`/?${params.toString()}`);
                }}
              >
                Prev
              </button>
              <span className="muted">
                Page {searchPage} / {searchTotalPages}
              </span>
              <button
                className="pill"
                type="button"
                disabled={searchPage >= searchTotalPages || searchLoading}
                onClick={() => {
                  const nextPage = Math.min(searchTotalPages, searchPage + 1);
                  const params = new URLSearchParams({
                    query: searchQuery,
                    page: String(nextPage),
                  });
                  if (filters.genre) params.set("genre", filters.genre);
                  if (filters.style) params.set("style", filters.style);
                  if (filters.year) params.set("year", filters.year);
                  if (filters.sort) params.set("sort", filters.sort);
                  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
                  router.replace(`/?${params.toString()}`);
                }}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
        </div>

      <div className="section">
        <PageHeader
          title="Recommended for you"
          description="Based on your taste and recent discoveries."
        />
        {loading ? (
          <RecordSkeletonGrid count={6} />
        ) : error ? (
          <p className="muted">{error}</p>
        ) : (
          <RecordGrid
            records={recommendations}
            emptyMessage="No recommendations yet. Add items to your collection to improve picks."
            actionLabel="Add to collection"
            onAction={handleAddCollection}
            secondaryActionLabel="Wishlist"
            onSecondaryAction={handleWishlist}
            primaryLoadingIds={primaryPending}
            secondaryLoadingIds={secondaryPending}
            collectionIds={collectionIds}
            wishlistIds={wishlistIds}
            onSelect={(record, rect) => setModalState({ record, originRect: rect })}
            className="fancy-grid"
          />
        )}
    </div>

      {modalState ? (
        <RecordModal
          record={modalState.record}
          originRect={modalState.originRect}
          onClose={() => setModalState(null)}
        />
      ) : null}
    </AuthGate>
  );
}

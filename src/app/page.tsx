"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiDisc, FiKey, FiLoader, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import RecordGrid from "@/components/ui/RecordGrid";
import RecordModal from "@/components/ui/RecordModal";
import RecordShelf from "@/components/collection/RecordShelf";
import { addToCollection, getCollection, getIdentity, getOriginalReleaseYear, removeFromCollection, searchDiscogs, type DiscogsIdentity } from "@/lib/discogs-client";
import type { RecordItem } from "@/types/record";

type SortMode = "recent" | "artist" | "title" | "albumYear" | "pressingYear";
const TOKEN_KEY = "vinylbox.discogs-token";
const MASTER_YEAR_KEY = "vinylbox.discogs-master-years";

function sortRecords(records: RecordItem[], sort: SortMode) {
  return [...records].sort((a, b) => {
    if (sort === "artist") return a.artist.localeCompare(b.artist);
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "albumYear") return Number(b.originalYear ?? b.year ?? 0) - Number(a.originalYear ?? a.year ?? 0);
    if (sort === "pressingYear") return Number(b.year ?? 0) - Number(a.year ?? 0);
    return 0;
  });
}

export default function Home() {
  const [token, setToken] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [identity, setIdentity] = useState<DiscogsIdentity | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shelfQuery, setShelfQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RecordItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | undefined>();
  const [originalYearProgress, setOriginalYearProgress] = useState<{ resolved: number; total: number } | null>(null);
  const [modal, setModal] = useState<{ record: RecordItem; originRect: DOMRect } | null>(null);
  const isResolvingOriginalYears = useRef(false);

  const loadCollection = useCallback(async (activeToken: string, activeIdentity: DiscogsIdentity) => {
    setLoading(true);
    try {
      setRecords(await getCollection(activeToken, activeIdentity.username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this Discogs collection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async (candidate: string) => {
    const cleanToken = candidate.trim();
    if (!cleanToken) return;
    setConnecting(true);
    setError(null);
    try {
      const nextIdentity = await getIdentity(cleanToken);
      window.localStorage.setItem(TOKEN_KEY, cleanToken);
      setToken(cleanToken);
      setIdentity(nextIdentity);
      await loadCollection(cleanToken, nextIdentity);
    } catch (cause) {
      window.localStorage.removeItem(TOKEN_KEY);
      setError(cause instanceof Error ? cause.message : "That Discogs token could not be verified.");
    } finally {
      setConnecting(false);
    }
  }, [loadCollection]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY);
    if (savedToken) void connect(savedToken);
  }, [connect]);

  const visibleRecords = useMemo(() => {
    const needle = shelfQuery.trim().toLowerCase();
    const filtered = needle ? records.filter((record) => `${record.artist} ${record.title} ${record.genre ?? ""}`.toLowerCase().includes(needle)) : records;
    return sortRecords(filtered, sort);
  }, [records, shelfQuery, sort]);
  const collectionIds = useMemo(() => new Set(records.map((record) => record.id)), [records]);

  const resolveOriginalYears = async () => {
    if (!token || isResolvingOriginalYears.current) return;
    isResolvingOriginalYears.current = true;
    let cached: Record<string, string | null> = {};
    try {
      cached = JSON.parse(window.localStorage.getItem(MASTER_YEAR_KEY) ?? "{}") as Record<string, string | null>;
    } catch {
      // An invalid local cache should never prevent collection browsing.
    }

    const masterIds = [...new Set(records.flatMap((record) => record.masterId ? [record.masterId] : []))];
    const applyResolvedYears = () => setRecords((current) => current.map((record) => record.masterId && record.masterId in cached ? { ...record, originalYear: cached[record.masterId] ?? undefined } : record));
    let resolved = masterIds.filter((id) => id in cached).length;
    if (resolved) applyResolvedYears();
    setOriginalYearProgress({ resolved, total: masterIds.length });

    try {
      for (const masterId of masterIds) {
        if (masterId in cached) continue;
        try {
          cached[masterId] = (await getOriginalReleaseYear(token, masterId)) ?? null;
        } catch {
          // Keep the pressing year as the graceful fallback for a missing or rate-limited master.
          cached[masterId] = null;
        }
        resolved += 1;
        window.localStorage.setItem(MASTER_YEAR_KEY, JSON.stringify(cached));
        setOriginalYearProgress({ resolved, total: masterIds.length });
        // Discogs' authenticated API is rate-limited; one lookup per 1.1 seconds stays below 60/minute.
        await new Promise((resolve) => window.setTimeout(resolve, 1100));
      }
      applyResolvedYears();
    } finally {
      isResolvingOriginalYears.current = false;
      setOriginalYearProgress(null);
    }
  };

  const handleConnect = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void connect(keyInput); };
  const handleSortChange = (nextSort: SortMode) => {
    setSort(nextSort);
    if (nextSort === "albumYear") void resolveOriginalYears();
  };
  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !searchQuery.trim()) return;
    setSearching(true); setError(null);
    try { setSearchResults(await searchDiscogs(token, searchQuery.trim())); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Search did not complete."); }
    finally { setSearching(false); }
  };
  const handleAdd = async (record: RecordItem) => {
    if (!token || !identity) return;
    setBusyId(record.id); setError(null);
    try { await addToCollection(token, identity.username, record.id); await loadCollection(token, identity); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add that release."); }
    finally { setBusyId(undefined); }
  };
  const handleRemove = async (record: RecordItem) => {
    if (!token || !identity) return;
    setBusyId(record.instanceId); setError(null);
    try { await removeFromCollection(token, identity.username, record); setRecords((current) => current.filter((item) => item.instanceId !== record.instanceId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove that copy."); }
    finally { setBusyId(undefined); }
  };
  const disconnect = () => {
    window.localStorage.removeItem(TOKEN_KEY); setToken(""); setKeyInput(""); setIdentity(null); setRecords([]); setSearchResults([]); setError(null);
  };

  if (!identity) return (
    <section className="connect-page">
      <div className="connect-art" aria-hidden="true"><span className="record-one" /><span className="record-two" /><span className="record-three" /></div>
      <div className="connect-copy">
        <p className="eyebrow">Your records, already waiting</p>
        <h1>Put your collection<br /><em>on the shelf.</em></h1>
        <p className="lead">Connect your Discogs account and browse the records you actually own — by cover, like a real listening room.</p>
        <form className="key-form" onSubmit={handleConnect}>
          <label htmlFor="discogs-token">Discogs personal access token</label>
          <div className="key-row"><FiKey aria-hidden="true" /><input id="discogs-token" value={keyInput} onChange={(event) => setKeyInput(event.target.value)} placeholder="Paste your token" autoComplete="off" spellCheck="false" /><button type="submit" disabled={connecting}>{connecting ? <FiLoader className="spin" /> : "Open my shelf"}</button></div>
        </form>
        {error ? <p className="notice error">{error}</p> : null}
        <p className="privacy-note">Stored only in this browser. Create a token in <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noreferrer">your Discogs developer settings</a>.</p>
      </div>
    </section>
  );

  return (
    <div className="collection-page">
      <header className="collection-hero">
        <div><p className="eyebrow">{identity.username}&apos;s listening room</p><h1>Your <em>vinyl</em> collection</h1><p className="collection-count"><FiDisc aria-hidden="true" /> {records.length.toLocaleString()} {records.length === 1 ? "record" : "records"} on the shelf</p></div>
        <details className="account-menu"><summary>Collection settings <FiChevronDown aria-hidden="true" /></summary><div className="account-popover"><p>Your Discogs token is stored locally in this browser.</p><button type="button" onClick={disconnect}>Forget token</button></div></details>
      </header>
      {error ? <p className="notice error">{error}<button onClick={() => setError(null)} aria-label="Dismiss message"><FiX /></button></p> : null}
      <section className="shelf-section" id="collection">
        <div className="section-topline"><div><p className="eyebrow">The crate</p><h2>Pull out a sleeve</h2></div><button className="quiet-button" type="button" onClick={() => void loadCollection(token, identity)} disabled={loading}><FiRefreshCw className={loading ? "spin" : ""} /> Refresh</button></div>
        <div className="shelf-controls"><label className="mini-search"><FiSearch aria-hidden="true" /><input value={shelfQuery} onChange={(event) => setShelfQuery(event.target.value)} placeholder="Filter your shelf" /></label><label className="sort-select">Sort <select value={sort} onChange={(event) => handleSortChange(event.target.value as SortMode)}><option value="recent">Recently added</option><option value="artist">Artist A–Z</option><option value="title">Title A–Z</option><option value="albumYear">Original album date</option><option value="pressingYear">This pressing’s year</option></select></label></div>
        {sort === "albumYear" && originalYearProgress ? <p className="year-sort-note">Preparing original dates · {originalYearProgress.resolved} / {originalYearProgress.total}</p> : null}
        {loading ? <div className="shelf-loading"><FiLoader className="spin" /> Loading your sleeves…</div> : <RecordShelf records={visibleRecords} onSelect={(record, originRect) => setModal({ record, originRect })} onRemove={handleRemove} busyId={busyId} />}
      </section>
      <section className="finder-section" id="find">
        <div className="section-topline"><div><p className="eyebrow">Bring something home</p><h2>Find a record</h2></div><p className="finder-caption">Search the Discogs vinyl database, then add the exact pressing.</p></div>
        <form className="finder-form" onSubmit={handleSearch}><FiSearch aria-hidden="true" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Artist, album, label, catalog number…" /><button type="submit" disabled={searching}>{searching ? <FiLoader className="spin" /> : "Search Discogs"}</button></form>
        {searching ? <p className="search-state">Looking through the bins…</p> : null}
        {searchResults.length ? <div className="search-results"><RecordGrid records={searchResults} actionLabel="Add to collection" onAction={handleAdd} primaryLoadingIds={busyId ? new Set([busyId]) : undefined} collectionIds={collectionIds} onSelect={(record, originRect) => setModal({ record, originRect })} /></div> : null}
      </section>
      <p className="attribution">Data provided by <a href="https://www.discogs.com/" target="_blank" rel="noreferrer">Discogs</a>.</p>
      {modal ? <RecordModal record={modal.record} originRect={modal.originRect} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

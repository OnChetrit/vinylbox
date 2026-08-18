"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/auth/AuthGate";
import PageHeader from "@/components/ui/PageHeader";
import RecordGrid from "@/components/ui/RecordGrid";
import { RecordSkeletonGrid } from "@/components/ui/RecordSkeleton";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  fetchCollection,
  removeCollectionItem,
  upsertWishlistItem,
} from "@/lib/vinylData";
import type { RecordItem } from "@/types/record";

export default function CollectionPage() {
  const { supabase, session } = useSupabase();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [primaryPending, setPrimaryPending] = useState<Set<string>>(new Set());
  const [secondaryPending, setSecondaryPending] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchCollection(supabase, session.user.id);
      setRecords(data);
      setLoading(false);
    };
    load();
  }, [session, supabase]);

  const moveToWishlist = async (record: RecordItem) => {
    if (!session) return;
    setSecondaryPending((prev) => new Set(prev).add(record.id));
    await upsertWishlistItem(supabase, session.user.id, record);
    await removeCollectionItem(supabase, session.user.id, record.id);
    setRecords((prev) => prev.filter((item) => item.id !== record.id));
    setSecondaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  const removeFromCollection = async (record: RecordItem) => {
    if (!session) return;
    setPrimaryPending((prev) => new Set(prev).add(record.id));
    await removeCollectionItem(supabase, session.user.id, record.id);
    setRecords((prev) => prev.filter((item) => item.id !== record.id));
    setPrimaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  return (
    <AuthGate>
      <div className="section">
        <PageHeader
          title="Collection"
          description="All records linked to your Supabase user."
          chips={[`Total: ${records.length}`]}
        />
        {loading ? <p className="muted">Loading collection…</p> : null}
        {loading ? (
          <RecordSkeletonGrid count={6} />
        ) : (
          <RecordGrid
            records={records}
            emptyMessage="No records yet. Add from Search to start your shelf."
            actionLabel="Remove"
            onAction={removeFromCollection}
            secondaryActionLabel="Wishlist"
            onSecondaryAction={moveToWishlist}
            primaryLoadingIds={primaryPending}
            secondaryLoadingIds={secondaryPending}
            collectionIds={new Set(records.map((r) => r.id))}
            className="fancy-grid"
          />
        )}
      </div>
    </AuthGate>
  );
}


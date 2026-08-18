"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/auth/AuthGate";
import PageHeader from "@/components/ui/PageHeader";
import RecordGrid from "@/components/ui/RecordGrid";
import { RecordSkeletonGrid } from "@/components/ui/RecordSkeleton";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import {
  fetchWishlist,
  removeWishlistItem,
  upsertCollectionItem,
} from "@/lib/vinylData";
import type { RecordItem } from "@/types/record";

export default function WishlistPage() {
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
      const data = await fetchWishlist(supabase, session.user.id);
      setRecords(data);
      setLoading(false);
    };
    load();
  }, [session, supabase]);

  const moveToCollection = async (record: RecordItem) => {
    if (!session) return;
    setPrimaryPending((prev) => new Set(prev).add(record.id));
    await upsertCollectionItem(supabase, session.user.id, record);
    await removeWishlistItem(supabase, session.user.id, record.id);
    setRecords((prev) => prev.filter((item) => item.id !== record.id));
    setPrimaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  const removeFromWishlist = async (record: RecordItem) => {
    if (!session) return;
    setSecondaryPending((prev) => new Set(prev).add(record.id));
    await removeWishlistItem(supabase, session.user.id, record.id);
    setRecords((prev) => prev.filter((item) => item.id !== record.id));
    setSecondaryPending((prev) => {
      const next = new Set(prev);
      next.delete(record.id);
      return next;
    });
  };

  return (
    <AuthGate>
      <div className="section">
        <PageHeader
          title="Wishlist"
          description="Keep an eye on grails and notify yourself when you buy them."
          chips={[`Saved: ${records.length}`]}
        />
        {loading ? <p className="muted">Loading wishlist…</p> : null}
        {loading ? (
          <RecordSkeletonGrid count={6} />
        ) : (
          <RecordGrid
            records={records}
            emptyMessage="Wishlist is empty. Add from Search or recommendations."
            actionLabel="Move to collection"
            onAction={moveToCollection}
            primaryLoadingIds={primaryPending}
            secondaryActionLabel="Remove"
            onSecondaryAction={removeFromWishlist}
            secondaryLoadingIds={secondaryPending}
            wishlistIds={new Set(records.map((r) => r.id))}
            className="fancy-grid"
          />
        )}
      </div>
    </AuthGate>
  );
}


"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { RecordItem } from "@/types/record";
import RecordCard from "./RecordCard";

type Props = {
  records: RecordItem[];
  emptyMessage?: string;
  actionLabel?: string;
  onAction?: (record: RecordItem) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (record: RecordItem) => void;
  primaryLoadingIds?: Set<string>;
  secondaryLoadingIds?: Set<string>;
  className?: string;
  collectionIds?: Set<string>;
  wishlistIds?: Set<string>;
  onSelect?: (record: RecordItem, rect: DOMRect) => void;
};

export default function RecordGrid({
  records,
  emptyMessage,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  primaryLoadingIds,
  secondaryLoadingIds,
  className,
  collectionIds,
  wishlistIds,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !records.length) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [records]);

  if (!records.length) {
    return <p className="muted">{emptyMessage ?? "Nothing here yet."}</p>;
  }

  return (
    <div className={className ?? "grid"} ref={containerRef}>
      {records.map((record) => (
        <div key={record.id} data-card>
          <RecordCard
            record={record}
            actionLabel={actionLabel}
            onAction={onAction}
            secondaryActionLabel={secondaryActionLabel}
            onSecondaryAction={onSecondaryAction}
            primaryLoading={primaryLoadingIds?.has(record.id)}
            secondaryLoading={secondaryLoadingIds?.has(record.id)}
            isInCollection={collectionIds?.has(record.id)}
            isInWishlist={wishlistIds?.has(record.id)}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}


'use client';

import Image from "next/image";
import styles from "./RecordCard.module.scss";
import type { RecordItem } from "@/types/record";
import { FiPlus, FiHeart, FiTrash, FiMusic, FiTag, FiCheck } from "react-icons/fi";
import { useRef } from "react";

type Props = {
  record: RecordItem;
  actionLabel?: string;
  onAction?: (record: RecordItem) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (record: RecordItem) => void;
  primaryLoading?: boolean;
  secondaryLoading?: boolean;
  isInCollection?: boolean;
  isInWishlist?: boolean;
  onSelect?: (record: RecordItem, rect: DOMRect) => void;
};

export default function RecordCard({
  record,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  primaryLoading,
  secondaryLoading,
  isInCollection,
  isInWishlist,
  onSelect,
}: Props) {
  const cardRef = useRef<HTMLElement | null>(null);
  const primaryIsRemove = actionLabel?.toLowerCase().includes("remove");
  const secondaryIsRemove = secondaryActionLabel?.toLowerCase().includes("remove");

  const primaryIcon = primaryIsRemove
    ? <FiTrash aria-hidden />
    : isInCollection
      ? <FiCheck aria-hidden />
      : actionLabel?.toLowerCase().includes("wishlist")
        ? <FiHeart aria-hidden />
        : <FiPlus aria-hidden />;

  const secondaryIcon = secondaryIsRemove
    ? <FiTrash aria-hidden />
    : secondaryActionLabel?.toLowerCase().includes("wishlist")
      ? (isInWishlist ? <FiCheck aria-hidden /> : <FiHeart aria-hidden />)
      : <FiTrash aria-hidden />;

  return (
    <article
      className={styles.card}
      onClick={() => {
        if (!onSelect || !cardRef.current) return;
        onSelect(record, cardRef.current.getBoundingClientRect());
      }}
      ref={cardRef}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!onSelect || !cardRef.current) return;
          onSelect(record, cardRef.current.getBoundingClientRect());
        }
      }}
    >
      <div className={styles.media}>
        <Image
          src={record.coverUrl || "/file.svg"}
          alt={`${record.title} cover`}
          width={400}
          height={400}
          className={styles.thumb}
          priority={false}
        />
        {(actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction) ? (
          <div className={styles.actionOverlay}>
            {actionLabel && onAction ? (
              <button
                className={`${styles.actionBtn} ${styles.left}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(record);
                }}
                type="button"
                disabled={primaryLoading || (!primaryIsRemove && isInCollection)}
                title={
                  primaryIsRemove
                    ? "Remove from collection"
                    : isInCollection
                      ? "Already in collection"
                      : undefined
                }
              >
                {primaryLoading ? (
                  <span className="spinner" />
                ) : (
                  primaryIcon
                )}
              </button>
            ) : null}
            {secondaryActionLabel && onSecondaryAction ? (
              <button
                className={`${styles.actionBtn} ${styles.right}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSecondaryAction(record);
                }}
                type="button"
                disabled={secondaryLoading || (!secondaryIsRemove && isInWishlist)}
                title={
                  secondaryIsRemove
                    ? "Remove from wishlist"
                    : isInWishlist
                      ? "Already in wishlist"
                      : undefined
                }
              >
                {secondaryLoading ? (
                  <span className="spinner" />
                ) : (
                  secondaryIcon
                )}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className={styles.bottomMeta}>
          {record.genre ? (
            <span className={styles.tag}>
              <FiMusic aria-hidden /> {record.genre}
            </span>
          ) : null}
          {record.style ? (
            <span className={styles.tag}>
              <FiTag aria-hidden /> {record.style}
            </span>
          ) : null}
        </div>
      </div>
      <div>
        <h3 className={styles.title}>{record.title}</h3>
        <div className={styles.meta}>
          <span>{record.artist}</span>
          {record.year ? <span>· {record.year}</span> : null}
        </div>
      </div>
      <div className={styles.footer}>
        {/* Footer kept for spacing; actions move to image overlay */}
      </div>
    </article>
  );
}


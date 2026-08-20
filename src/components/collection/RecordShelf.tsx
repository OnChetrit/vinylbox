"use client";

import { type CSSProperties, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import type { RecordItem } from "@/types/record";
import styles from "./RecordShelf.module.scss";

type Props = {
  records: RecordItem[];
  onSelect: (record: RecordItem, rect: DOMRect) => void;
  onRemove: (record: RecordItem) => void;
  busyId?: string;
};

export default function RecordShelf({ records, onSelect, onRemove, busyId }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const hasPlayedEntrance = useRef(false);

  useLayoutEffect(() => {
    if (!railRef.current || !records.length || hasPlayedEntrance.current) return;
    hasPlayedEntrance.current = true;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-sleeve]",
        { opacity: 0, y: 42, rotate: -3 },
        { opacity: 1, y: 0, rotate: 0, duration: 0.7, stagger: 0.035, ease: "power3.out", clearProps: "transform" },
      );
    }, railRef);
    return () => context.revert();
  }, [records]);

  if (!records.length) return <p className="muted">There are no records on this shelf yet.</p>;

  return (
    <div className={styles.viewport}>
      <div className={styles.rail} ref={railRef}>
        {records.map((record, index) => {
          // A small repeating arc makes the shelf feel hand-filed rather than mechanically flat.
          const bowPosition = (index % 11) - 5;
          const sleeveStyle = {
            "--bow-drop": `${Math.abs(bowPosition) * 3}px`,
            "--bow-lean": `${bowPosition * 0.85}deg`,
          } as CSSProperties;

          return (
          <article className={styles.sleeve} data-sleeve key={`${record.id}-${record.instanceId ?? index}`} style={sleeveStyle}>
            <button
              className={styles.coverButton}
              type="button"
              onClick={(event) => onSelect(record, event.currentTarget.getBoundingClientRect())}
              aria-label={`Open ${record.title}`}
            >
              <Image src={record.coverUrl || "/file.svg"} alt="" width={360} height={360} className={styles.cover} />
              <span className={styles.rim} />
            </button>
            <div className={styles.details}>
              <p>{record.title}</p>
              <span>{record.artist}{record.originalYear ? ` · original ${record.originalYear}` : record.year ? ` · pressing ${record.year}` : ""}</span>
            </div>
            <button
              className={styles.remove}
              type="button"
              disabled={busyId === record.instanceId}
              onClick={() => onRemove(record)}
              aria-label={`Remove ${record.title}`}
            >
              {busyId === record.instanceId ? "…" : "−"}
            </button>
          </article>
          );
        })}
      </div>
      <div className={styles.plinth} />
    </div>
  );
}

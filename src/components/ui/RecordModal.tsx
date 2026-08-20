"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import Image from "next/image";
import styles from "./RecordModal.module.scss";
import type { RecordItem } from "@/types/record";

type Props = {
  record: RecordItem;
  originRect: DOMRect;
  onClose: () => void;
};

export default function RecordModal({ record, originRect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    const targetRect = panel.getBoundingClientRect();
    const scaleX = originRect.width / targetRect.width;
    const scaleY = originRect.height / targetRect.height;
    const x =
      originRect.left +
      originRect.width / 2 -
      (targetRect.left + targetRect.width / 2);
    const y =
      originRect.top +
      originRect.height / 2 -
      (targetRect.top + targetRect.height / 2);

    gsap.set(panel, { scaleX, scaleY, x, y, transformOrigin: "center center" });
    gsap.to(panel, {
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      borderRadius: 16,
      duration: 0.35,
      ease: "power2.out",
      clearProps: "transform",
    });

    gsap.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" },
    );

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [originRect, onClose]);

  return createPortal(
    <div className={styles.overlay} ref={overlayRef} onClick={onClose}>
      <div
        className={styles.panel}
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose}>
          Close
        </button>
        <Image
          src={record.coverUrl || "/file.svg"}
          alt={`${record.title} cover`}
          width={800}
          height={800}
          className={styles.cover}
        />
        <div className={styles.meta}>
          <h2 style={{ margin: 0 }}>{record.title}</h2>
          <div className="muted">
            {record.artist}
            {record.originalYear ? ` · original release ${record.originalYear}` : record.year ? ` · pressing ${record.year}` : ""}
            {record.country ? ` · ${record.country}` : ""}
          </div>
          <div className={styles.tags}>
            {record.genre ? <span className={styles.tag}>{record.genre}</span> : null}
            {record.style ? <span className={styles.tag}>{record.style}</span> : null}
            {record.labels?.length ? (
              <span className={styles.tag}>{record.labels.join(", ")}</span>
            ) : null}
            {record.formats?.length ? (
              <span className={styles.tag}>{record.formats.join(", ")}</span>
            ) : null}
          </div>
          {record.description ? <p className="muted">{record.description}</p> : null}
          {record.tracklist?.length ? (
            <div>
              <h4 style={{ margin: "12px 0 6px" }}>Tracklist</h4>
              <ol className={styles.tracklist}>
                {record.tracklist.map((t, idx) => (
                  <li key={`${t}-${idx}`}>{t}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

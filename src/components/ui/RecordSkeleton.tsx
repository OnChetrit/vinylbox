export function RecordSkeleton() {
  return (
    <article className="skeleton" style={{ padding: 14, minHeight: 320 }}>
      <div
        className="skeleton"
        style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: "none" }}
      />
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        <div style={{ height: 16, width: "70%", border: "none" }} />
        <div style={{ height: 14, width: "40%", border: "none" }} />
        <div
          style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}
        >
          <div style={{ height: 22, width: 64, border: "none" }} />
          <div style={{ height: 22, width: 74, border: "none" }} />
        </div>
        <div
          style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
        >
          <div style={{ height: 32, width: 110, border: "none" }} />
          <div style={{ height: 32, width: 110, border: "none" }} />
        </div>
      </div>
    </article>
  );
}

export function RecordSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, idx) => (
        <RecordSkeleton key={idx} />
      ))}
    </div>
  );
}




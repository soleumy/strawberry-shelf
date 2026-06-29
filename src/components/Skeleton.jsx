export function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function NovelCardSkeleton() {
  return (
    <div className="novel-card skeleton-card">
      <Skeleton className="skeleton-cover" />
      <div className="novel-body">
        <Skeleton className="skeleton-line skeleton-line-lg" />
        <Skeleton className="skeleton-line skeleton-line-sm" />
      </div>
    </div>
  );
}

export function NovelGridSkeleton({ count = 8 }) {
  return (
    <div className="novel-grid">
      {Array.from({ length: count }).map((_, i) => (
        <NovelCardSkeleton key={i} />
      ))}
    </div>
  );
}

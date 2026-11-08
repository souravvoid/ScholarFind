/** Loading placeholder matching final content geometry (no spinners for page content). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse rounded-chip bg-paper-sunken ${className}`}
    />
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading results" className="divide-y divide-hairline border-y border-hairline">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-24 rounded-control" />
          </div>
        </div>
      ))}
    </div>
  );
}

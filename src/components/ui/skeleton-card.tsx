import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-6 animate-pulse', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 skeleton-pulse" />
        <div className="h-8 w-8 rounded-lg skeleton-pulse" />
      </div>
      <div className="h-8 w-32 skeleton-pulse mb-2" />
      <div className="h-3 w-20 skeleton-pulse" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 animate-pulse">
          <div className="h-10 w-10 rounded-full skeleton-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 skeleton-pulse" />
            <div className="h-3 w-24 skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonCardProps) {
  return (
    <div className={cn('glass-card p-6 animate-pulse', className)}>
      <div className="h-5 w-40 skeleton-pulse mb-6" />
      <div className="h-48 skeleton-pulse rounded-xl" />
    </div>
  );
}

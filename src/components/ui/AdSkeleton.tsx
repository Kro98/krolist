import { cn } from "@/lib/utils";

interface AdSkeletonProps {
  className?: string;
}

export function AdSkeleton({ className }: AdSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center gap-3 py-6",
        className
      )}
    >
      {/* Shimmer bars mimicking ad content */}
      <div className="w-3/4 h-3 rounded-full bg-muted/40 animate-pulse" />
      <div className="w-1/2 h-3 rounded-full bg-muted/30 animate-pulse delay-75" />
      <div className="w-2/3 h-2.5 rounded-full bg-muted/20 animate-pulse delay-150" />
    </div>
  );
}

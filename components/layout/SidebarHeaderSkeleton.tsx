import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarHeaderSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-3 h-9 w-full rounded-md" />
    </div>
  );
}


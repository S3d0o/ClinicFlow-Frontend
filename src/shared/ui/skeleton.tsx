import { cn } from "@/shared/lib/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-secondary/60 animate-pulse rounded-lg", className)}
      {...props}
    />
  )
}

export { Skeleton }

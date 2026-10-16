import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-card placeholder:text-muted-foreground/80 flex field-sizing-content min-h-20 w-full rounded-lg border px-3 py-2 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Teach tailwind-merge the custom type scale and shadows from tailwind.config.js. Without this it
// reads `text-label-md` as a text *color* and drops it when merged with e.g. `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-lg", "display-md", "headline-xl", "headline-lg", "headline-md", "title-sm",
            "body-lg", "body-md", "body-sm", "label-md", "label-sm", "caption",
          ],
        },
      ],
      shadow: [{ shadow: ["card", "hover", "elevated"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

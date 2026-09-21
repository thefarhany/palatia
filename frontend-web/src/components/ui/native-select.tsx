import * as React from "react";
import { cn } from "@/lib/utils";

// Lucide chevron-down — own SVG so position & padding are controllable.
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/** Styled native <select> — chevron drawn at right with breathing room. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      style={{ backgroundImage: CHEVRON, backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat" }}
      className={cn(
        "h-10 w-full appearance-none rounded-lg border border-[#e4e7ec] bg-white py-0 pl-3 pr-9 text-sm text-[#17181c] outline-none transition-[color,box-shadow] focus-visible:border-[#4f46e5] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-card dark:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { NativeSelect };
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Free-text input with suggestions (native datalist) that LOOKS like a select:
 * same chevron, same paddings. Unlike NativeSelect the user can type anything.
 */
function ComboboxInput({
  listId,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { listId: string }) {
  return (
    <div className={cn("relative", className)}>
      <Input
        className="pr-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        list={listId}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
    </div>
  );
}

export { ComboboxInput };
"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: number | string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: number | string | null;
  onChange: (value: any) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyText = "Bahan tidak ditemukan",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-[#e4e7ec] bg-white px-3 text-sm text-left outline-none transition-[color,box-shadow] focus-visible:border-[#4f46e5] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-card dark:text-foreground",
            !selectedOption && "text-[#667085] dark:text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-[#667085] ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-50 min-w-[220px]"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-56 overflow-y-auto p-1">
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = String(option.value) === String(value);
                const filterValue = option.label + (option.sublabel ? ` ${option.sublabel}` : "");
                return (
                  <CommandItem
                    key={String(option.value)}
                    value={filterValue}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center justify-between px-2.5 py-2 text-sm"
                  >
                    <span className="truncate">
                      {option.label}
                      {option.sublabel && (
                        <span className="ml-1 text-xs text-muted-foreground">({option.sublabel})</span>
                      )}
                    </span>
                    {isSelected && <Check className="size-4 text-[#4f46e5] shrink-0 ml-2" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

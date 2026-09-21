"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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

/**
 * Combobox: dropdown rapi dari daftar (mis. supplier dari DB) + bebas ketik
 * nilai baru. Untuk field yang harus boleh custom — bukan enum ketat.
 */
interface ComboSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function ComboSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih atau ketik...",
  searchPlaceholder = "Cari / ketik baru...",
  emptyText = "Tekan Enter untuk pakai nilai ini",
  className,
}: ComboSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-[#e4e7ec] bg-white px-3 text-sm text-left outline-none transition-[color,box-shadow] focus-visible:border-[#4f46e5] focus-visible:ring-2 focus-visible:ring-[#4f46e5]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-card dark:text-foreground",
            !value && "text-[#667085] dark:text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-[#667085]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options
                .filter((o) => o.toLowerCase().includes(search.toLowerCase()))
                .map((o) => (
                  <CommandItem
                    key={o}
                    value={o}
                    onSelect={() => {
                      onChange(o);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {o}
                  </CommandItem>
                ))}
              {/* Bebas ketik nilai baru — bukan enum terkunci */}
              {search && !options.some((o) => o.toLowerCase() === search.toLowerCase()) && (
                <CommandItem
                  onSelect={() => {
                    onChange(search);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="text-[#4f46e5]"
                >
                  + Pakai &ldquo;{search}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

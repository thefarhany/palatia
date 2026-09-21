"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("id-ID");

/**
 * Input angka bertampilan Rupiah: user ketik bebas, tampil terformat (28.000).
 * onValueChange selalu kirim angka polos (number).
 */
export function CurrencyInput({
  value,
  onValueChange,
  prefix,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: number | undefined;
  onValueChange: (value: number) => void;
  prefix?: string;
}) {
  const display = value === undefined || Number.isNaN(value) ? "" : fmt.format(value);
  return (
    <div className={cn("relative", className)}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#667085]">{prefix}</span>
      )}
      <Input
        type="text"
        inputMode="numeric"
        placeholder="0"
        className={cn("h-10 rounded-lg", prefix ? "pl-10" : "pl-3", "pr-3")}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onValueChange(digits ? Number(digits) : 0);
        }}
        {...props}
      />
    </div>
  );
}

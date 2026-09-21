"use client";

import { Printer, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTablesStore } from "@/store/tables-store";
import { tableLabel } from "@/lib/format";
import type { TableRow } from "@/lib/types";

export function QrDialog({
  table,
  onOpenChange,
}: {
  table: TableRow | null;
  onOpenChange: () => void;
}) {
  const open = !!table;

  const rotateStore = useTablesStore((st) => st.rotateQr);
  const rotate = async () => {
    if (!table) return;
    await rotateStore(table.id)
      .then(() => toast.success(`QR ${tableLabel(table.number)} dirotasi — cetakan lama hangus`))
      .catch((e: Error) => toast.error(e.message));
    onOpenChange();
    // List refreshes on next open; the PNG URL is stable (regenerated server-side).
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate QR Code</DialogTitle>
          <DialogDescription className="sr-only">QR meja</DialogDescription>
        </DialogHeader>
        {table && (
          <>
            <div className="grid place-items-center gap-2 rounded-xl bg-[#f9fafb] p-6 dark:bg-muted/30">
              {/* BFF proxy serves the PNG with the admin JWT attached */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/proxy/bo/tables/${table.id}/qr.png`}
                alt={`QR ${tableLabel(table.number)}`}
                className="size-40 rounded-lg bg-white p-2"
              />
              <p className="font-mono text-xs text-[#667085] dark:text-muted-foreground">
                menu?t={table.qrToken ?? "(belum ada — simpan untuk generate)"}
              </p>
            </div>
            <p className="text-sm text-[#667085] dark:text-muted-foreground">
              QR menyimpan token acak (bukan ID meja) — gak bisa ditebak.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onOpenChange}>
                Batal
              </Button>
              <Button variant="outline" onClick={rotate}>
                <RotateCw className="size-4" />
                Rotate Token
              </Button>
              <Button
                onClick={() => {
                  window.open(`/api/proxy/bo/tables/${table.id}/qr.png`, "_blank", "noopener");
                  toast.info("QR terbuka di tab baru — Ctrl+P untuk print");
                }}
              >
                <Printer className="size-4" />
                Print PNG
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
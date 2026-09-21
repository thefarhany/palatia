"use client";

import { Loader2 } from "lucide-react";
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
import { useInventoryStore } from "@/store/inventory-store";
import { rp } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/types";

export function PoDetailDialog({
  po,
  onOpenChange,
  onChanged,
}: {
  po: PurchaseOrder | null;
  onOpenChange: () => void;
  onChanged: () => void;
}) {
  const open = !!po;
  const busy = false;

  // Telepon supplier = dari bahan yang pernah di-supply nama itu (DB tidak snapshot di PO).
  const supplierPhone = useInventoryStore((st) => st.ingredients).find(
    (i) => i.supplierName && po && i.supplierName === po.supplierName,
  )?.supplierPhone;

  const receivePOStore = useInventoryStore((st) => st.receivePO);
  const cancelPOStore = useInventoryStore((st) => st.cancelPO);

  const receive = async (id: number) => {
    await receivePOStore(id)
      .then(() => toast.success(`${po?.code} diterima — stok bertambah`))
      .catch((e: Error) => toast.error(e.message));
    onOpenChange();
    onChanged();
  };

  const cancel = async (id: number) => {
    await cancelPOStore(id)
      .then(() => toast.success(`${po?.code} dibatalkan`))
      .catch((e: Error) => toast.error(e.message));
    onOpenChange();
    onChanged();
  };

  const total = po?.items.reduce((s, i) => s + Number(i.qty) * Number(i.unitCost), 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {po && (
          <>
            <DialogHeader>
              <DialogTitle>{po.code}</DialogTitle>
              <DialogDescription>
                {po.supplierName}
                {supplierPhone && (
                  <>
                    {" · "}
                    <a href={`tel:${supplierPhone}`} className="hover:underline">
                      {supplierPhone}
                    </a>
                  </>
                )}
                {" · "}
                {new Date(po.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </DialogDescription>
            </DialogHeader>

            {/* Items */}
            <div className="grid gap-2">
              <div className="flex text-[11px] font-medium tracking-[1px] text-[#667085] dark:text-muted-foreground">
                <span className="flex-1">BAHAN</span>
                <span className="w-24 text-right">QTY</span>
                <span className="w-24 text-right">HARGA</span>
                <span className="w-24 text-right">SUBTOTAL</span>
              </div>
              {po.items.map((i) => (
                <div key={i.id} className="flex items-center text-sm">
                  <p className="flex-1 text-[#17181c] dark:text-foreground">{i.ingredient.name}</p>
                  <p className="w-24 text-right text-[#667085] dark:text-muted-foreground">
                    {Number(i.qty)} {i.ingredient.unit}
                  </p>
                  <p className="w-24 text-right text-[#667085] dark:text-muted-foreground">
                    {rp.format(Number(i.unitCost))}
                  </p>
                  <p className="w-24 text-right text-[#17181c] dark:text-foreground">
                    {rp.format(Number(i.qty) * Number(i.unitCost))}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[#e4e7ec] pt-3 dark:border-border">
                <p className="text-sm font-semibold text-[#17181c] dark:text-foreground">TOTAL</p>
                <p className="text-lg font-bold text-[#4f46e5] dark:text-primary">{rp.format(total)}</p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              {po.status === "ORDERED" ? (
                <>
                  <Button variant="outline" onClick={() => cancel(po.id)} disabled={busy}>
                    <Loader2 className={busy ? "size-4 animate-spin" : "hidden"} />
                    Batalkan
                  </Button>
                  <Button onClick={() => receive(po.id)} disabled={busy}>
                    Terima (Receive)
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onOpenChange}>
                  Tutup
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

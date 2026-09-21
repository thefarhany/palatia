"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useInventoryStore } from "@/store/inventory-store";
import { rp } from "@/lib/format";
import type { Ingredient, PurchaseOrder } from "@/lib/types";
import { IngredientDialog } from "@/components/backoffice/admin/inventory/ingredient-dialog";
import { PoDialog } from "@/components/backoffice/admin/inventory/po-dialog";
import { PoDetailDialog } from "./po-detail-dialog";

export function InventoryClient() {
  const ingredients = useInventoryStore((st) => st.ingredients);
  const pos = useInventoryStore((st) => st.pos);
  const fetchInv = useInventoryStore((st) => st.fetch);
  const [query, setQuery] = useState("");
  const [ingOpen, setIngOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [poOpen, setPoOpen] = useState(false);
  const [poDetail, setPoDetail] = useState<PurchaseOrder | null>(null);

  const filtered = useMemo(
    () => ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())),
    [ingredients, query],
  );
  const lowCount = ingredients.filter((i) => Number(i.stock) < Number(i.reorderLevel)).length;

  useEffect(() => {
    void fetchInv();
  }, [fetchInv]);

  const refetch = fetchInv;

  const receiveStore = useInventoryStore((st) => st.receivePO);
  const cancelPOStore = useInventoryStore((st) => st.cancelPO);

  const cancel = async (po: PurchaseOrder) => {
    await cancelPOStore(po.id)
      .then(() => toast.success(`${po.code} dibatalkan`))
      .catch((e: Error) => toast.error(e.message));
  };
  const receive = async (po: PurchaseOrder) => {
    await receiveStore(po.id)
      .then(() => toast.success(`${po.code} diterima — stok bertambah`))
      .catch((e: Error) => toast.error(e.message));
  };

  return (
    <>
      {lowCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-[#fef4f2] px-4 py-3 text-sm font-medium text-[#b54708] dark:bg-[#b54708]/10">
          <TriangleAlert className="size-4" />
          {lowCount} bahan di bawah reorder level — buat purchase order sebelum stok habis.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Input
            placeholder="Cari bahan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setPoOpen(true)}>
            Buat Purchase Order
          </Button>
          <Button
            className="h-10 rounded-[10px]"
            onClick={() => {
              setEditing(null);
              setIngOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah Bahan
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">BAHAN</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STOK</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                REORDER LEVEL
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">
                SUPPLIER
              </TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STATUS</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-[#667085]">
                  {query ? "Tidak ada bahan yang cocok." : "Belum ada bahan."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((ing) => {
              const low = Number(ing.stock) < Number(ing.reorderLevel);
              const onOrder = pos
                .filter((po) => po.status === "ORDERED")
                .flatMap((po) => po.items)
                .filter((i) => i.ingredient.id === ing.id)
                .reduce((sum, i) => sum + Number(i.qty), 0);
              return (
                <TableRow key={ing.id}>
                  <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">{ing.name}</TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {Number(ing.stock)} {ing.unit}
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {Number(ing.reorderLevel)} {ing.unit}
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {ing.supplierName || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                        low ? "bg-[#b54708]" : "bg-[#067647]"
                      }`}
                    >
                      {low ? "Low Stock" : "In Stock"}
                    </span>
                    {onOrder > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-[#2563eb]">
                        {onOrder} {ing.unit} di-PO
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Aksi ${ing.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(ing);
                            setIngOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Purchase orders — receive happens here (UC-24) */}
      {pos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
          <div className="flex items-center justify-between border-b border-[#e4e7ec] px-5 py-3 dark:border-border">
            <p className="text-sm font-semibold text-[#17181c] dark:text-foreground">
              Purchase Orders
              <span className="ml-2 rounded-full bg-[#f1f2f4] px-2 py-0.5 text-xs font-medium text-[#667085] dark:bg-muted dark:text-muted-foreground">
                {pos.filter((o) => o.status === "ORDERED").length} menunggu ·{" "}
                {pos.filter((o) => o.status !== "ORDERED").length} selesai
              </span>
            </p>
          </div>
          <div className="divide-y divide-[#e4e7ec] dark:divide-border">
            {pos.map((po) => (
              <div key={po.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setPoDetail(po)}
                  className="text-[13px] font-semibold text-[#4f46e5] hover:underline dark:text-primary"
                  title="Klik untuk lihat detail PO"
                >
                  {po.code}
                </button>
                <p className="text-[13px] text-[#667085] dark:text-muted-foreground">{po.supplierName}</p>
                <p className="text-xs text-[#667085] dark:text-muted-foreground">
                  {po.items.length} item · {rp.format(po.items.reduce((s, i) => s + Number(i.qty) * Number(i.unitCost), 0))}
                </p>
                <div className="flex-1" />
                {po.status === "ORDERED" ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 rounded-lg text-xs" onClick={() => receive(po)}>
                      Terima (Receive)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs text-[#d92d20] hover:bg-[#fef4f2]"
                      onClick={() => cancel(po)}
                    >
                      Batalkan
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                      po.status === "RECEIVED" ? "bg-[#067647]" : "bg-[#667085]"
                    }`}
                  >
                    {po.status === "RECEIVED" ? "Received" : "Cancelled"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <IngredientDialog
        open={ingOpen}
        onOpenChange={setIngOpen}
        editing={editing}
        onSaved={refetch}
      />
      <PoDialog open={poOpen} onOpenChange={setPoOpen} ingredients={ingredients} onSaved={refetch} />
      <PoDetailDialog po={poDetail} onOpenChange={() => setPoDetail(null)} onChanged={refetch} />
    </>
  );
}
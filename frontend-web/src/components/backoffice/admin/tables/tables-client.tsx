"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Printer, RotateCw, Search } from "lucide-react";
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
import { tableLabel, STATUS_BADGE } from "@/lib/format";
import { useTablesStore } from "@/store/tables-store";
import type { Table as TableData } from "@/lib/types";
export type { TableRow };
import { TableFormDialog } from "@/components/backoffice/admin/tables/table-form-dialog";
import { QrDialog } from "@/components/backoffice/admin/tables/qr-dialog";

export function TablesClient() {
  const tables = useTablesStore((st) => st.tables);
  const fetchTables = useTablesStore((st) => st.fetch);
  const rotateStore = useTablesStore((st) => st.rotateQr);
  const setStatusStore = useTablesStore((st) => st.setStatus);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableData | null>(null);
  const [qrFor, setQrFor] = useState<TableData | null>(null);

  const filtered = useMemo(
    () => tables.filter((t) => tableLabel(t.number).toLowerCase().includes(query.toLowerCase())),
    [tables, query],
  );

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  const refetch = fetchTables;

  const rotate = async (t: TableData) => {
    await rotateStore(t.id)
      .then(() => toast.success(`QR ${tableLabel(t.number)} dirotasi — cetakan lama otomatis hangus`))
      .catch((e: Error) => toast.error(e.message));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
          <Input
            placeholder="Cari meja..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-[10px]"
            onClick={() => window.open("/admin/tables/print", "_blank")}
          >
            <Printer className="size-4" />
            Print QR Semua
          </Button>
          <Button
            className="h-10 rounded-[10px]"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah Meja
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">MEJA</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">KAPASITAS</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STATUS</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">QR</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-[#667085]">
                  {query ? "Tidak ada meja yang cocok." : "Belum ada meja."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => {
              const badge = STATUS_BADGE[t.status];
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">
                    {tableLabel(t.number)}
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{t.capacity} orang</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setQrFor(t)}
                      >
                        👁 Lihat QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => rotate(t)}
                      >
                        <RotateCw className="size-3.5" />
                        Rotate
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Aksi ${tableLabel(t.number)}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(t);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const next = t.status === "OUT_OF_SERVICE" ? "FREE" : "OUT_OF_SERVICE";
                            await setStatusStore(t.id, next).catch((e: Error) => toast.error(e.message));
                            toast.success(
                              next === "OUT_OF_SERVICE"
                                ? `${tableLabel(t.number)} ditandai Out of Service`
                                : `${tableLabel(t.number)} aktif kembali`,
                            );
                            void refetch();
                          }}
                        >
                          {t.status === "OUT_OF_SERVICE" ? "Aktifkan Kembali" : "Tandai Out of Service"}
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

      <TableFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSaved={refetch}
      />
      <QrDialog table={qrFor} onOpenChange={() => setQrFor(null)} />
    </>
  );
}
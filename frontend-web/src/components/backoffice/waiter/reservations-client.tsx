"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useReservationsStore } from "@/store/reservations-store";
import type { Reservation as WaiterReservation, ReservationsFilter as Filter } from "@/lib/types";
import { useSocketEvent } from "@/components/providers/socket-provider";
import { tableLabel } from "@/lib/format";
import { STATUS_BADGE } from "@/lib/format";

// Staff transitions (server-enforced; UI mirrors them).
const NEXT: Record<string, { status: string; label: string }[]> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  CONFIRMED: [
    { status: "SEATED", label: "Seat" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  SEATED: [{ status: "COMPLETED", label: "Complete" }],
  COMPLETED: [],
  CANCELLED: [],
};



export function ReservationsClient() {
  const reservations = useReservationsStore((st) => st.reservations);
  const fetchRes = useReservationsStore((st) => st.fetch);
  const changeStatusStore = useReservationsStore((st) => st.changeStatus);
  const [filter, setFilter] = useState<Filter>("hari");

  const refetch = fetchRes;

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useSocketEvent("reservation:created", refetch);
  useSocketEvent("reservation:status", refetch);

  const filtered = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const dayOffset = filter === "hari" ? 0 : filter === "besok" ? 1 : null;
    if (dayOffset !== null) {
      const target = new Date(start);
      target.setDate(target.getDate() + dayOffset);
      const key = target.toISOString().slice(0, 10);
      return reservations.filter((r) => r.date.slice(0, 10) === key);
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return reservations.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d < end;
    });
  }, [reservations, filter]);

  const changeStatus = async (r: WaiterReservation, status: string) => {
    const customerName = r.user?.name ?? r.name ?? "Tamu";
    await changeStatusStore(r.id, status)
      .then(() => toast.success(`Reservasi ${customerName} → ${status}`))
      .catch((e: Error) => toast.error(e.message));
  };

  return (
    <>
      <div className="flex gap-2">
        {(
          [
            ["hari", "Hari ini"],
            ["besok", "Besok"],
            ["minggu", "Minggu ini"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-[#4f46e5] text-white dark:bg-primary"
                : "border border-[#e4e7ec] bg-white text-[#667085] hover:text-[#17181c] dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">PELANGGAN</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">NO. HP</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">TANGGAL</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">JAM</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">PAX</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">MEJA</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STATUS</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-[#667085]">
                  Tidak ada reservasi untuk rentang ini.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const customerName = r.user?.name ?? r.name ?? "Tamu";
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">{customerName}</TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="hover:underline hover:text-[#4f46e5]">
                        {r.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {new Date(r.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                  </TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{r.slot}</TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{r.guests} orang</TableCell>
                  <TableCell className="text-center text-[#667085] dark:text-muted-foreground">
                    {r.table ? tableLabel(r.table.number) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${STATUS_BADGE[r.status]?.cls ?? "bg-[#667085]"}`}
                    >
                      {STATUS_BADGE[r.status]?.label ?? r.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(NEXT[r.status]?.length ?? 0) > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi reservasi ${customerName}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {NEXT[r.status].map((t) => (
                            <DropdownMenuItem
                              key={t.status}
                              className={
                                t.status === "CANCELLED" ? "text-[#d92d20] focus:text-[#d92d20]" : ""
                              }
                              onClick={() => changeStatus(r, t.status)}
                            >
                              {t.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
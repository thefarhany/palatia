"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
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
import { useStaffStore } from "@/store/staff-store";
import type { StaffMember } from "@/lib/types";
import { StaffDialog } from "@/components/backoffice/admin/staff/staff-dialog";

const ROLE_BADGE: Record<StaffMember["role"], { label: string; cls: string }> = {
  ADMIN: { label: "Admin", cls: "bg-[#2563eb]" },
  CHEF: { label: "Chef", cls: "bg-[#b54708]" },
  WAITER: { label: "Waiter", cls: "bg-[#667085]" },
};

export function StaffClient() {
  const staff = useStaffStore((st) => st.staff);
  const fetchStaff = useStaffStore((st) => st.fetch);
  const toggleActiveStore = useStaffStore((st) => st.toggleActive);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const filtered = useMemo(
    () => staff.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
    [staff, query],
  );

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  const refetch = fetchStaff;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
          <Input
            placeholder="Cari staff..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <Button
          className="h-10 rounded-[10px]"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tambah Staff
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-[11px] font-medium tracking-[1px] text-[#667085]">NAMA</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">ROLE</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">EMAIL</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">STATUS</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-[#667085]">
                  {query ? "Tidak ada staff yang cocok." : "Belum ada staff."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#4f46e5] text-xs font-semibold text-white">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-semibold text-[#17181c] dark:text-foreground">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${ROLE_BADGE[member.role].cls}`}
                  >
                    {ROLE_BADGE[member.role].label}
                  </span>
                </TableCell>
                <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{member.email}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                      member.isActive ? "bg-[#067647]" : "bg-[#667085]"
                    }`}
                  >
                    {member.isActive ? "Aktif" : "Off duty"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Aksi ${member.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(member);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const next = !member.isActive;
                          toggleActiveStore(member)
                            .then(() =>
                              toast.success(
                                next ? `${member.name} diaktifkan` : `${member.name} dinonaktifkan`,
                              ),
                            )
                            .catch((e: Error) => toast.error(e.message));
                        }}
                      >
                        {member.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={refetch} />
    </>
  );
}
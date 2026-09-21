"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { toast } from "sonner";
import type { MenuItem } from "@/lib/types";
import { rp } from "@/lib/format";
import { useMenuStore } from "@/store/menu-store";
import { MenuFormDialog } from "@/components/backoffice/admin/menu/menu-form-dialog";
import { RecipeDialog } from "@/components/backoffice/admin/menu/recipe-dialog";

export type { MenuItem };
export function MenuClient() {
  const items = useMenuStore((st) => st.items);
  const categories = useMenuStore((st) => st.categories);
  const fetchMenu = useMenuStore((st) => st.fetch);
  const toggleAvailableStore = useMenuStore((st) => st.toggleAvailable);
  const removeStore = useMenuStore((st) => st.remove);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [recipeFor, setRecipeFor] = useState<MenuItem | null>(null);
  const [recipeMode, setRecipeMode] = useState<"view" | "edit">("edit");
  const [deleting, setDeleting] = useState<MenuItem | null>(null);

  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "all" || i.category === category) &&
          i.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query, category],
  );

  const refetch = fetchMenu;

  const toggleAvailable = async (item: { id: number; name: string }, available: boolean) => {
    await toggleAvailableStore(item.id, available);
    toast.success(`${item.name} ${available ? "tersedia" : " disembunyikan"}`);
  };

  const remove = async (item: { id: number; name: string }) => {
    try {
      await removeStore(item.id);
      toast.success(`${item.name} dihapus`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#667085]" />
          <Input
            placeholder="Cari menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <NativeSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-auto font-medium"
          >
            <option value="all">Filter</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </NativeSelect>
          <Button
            className="h-10 rounded-[10px]"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah Menu
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white dark:border-border dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fafb] hover:bg-[#f9fafb] dark:bg-muted/50">
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">NAMA MENU</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">KATEGORI</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">HARGA</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">RESEP</TableHead>
              <TableHead className="text-center text-[11px] font-medium tracking-[1px] text-[#667085]">KETERSEDIAAN</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-[#667085]">
                  {query || category !== "all" ? "Tidak ada menu yang cocok." : "Belum ada menu."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-center font-semibold text-[#17181c] dark:text-foreground">{item.name}</TableCell>
                <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{item.category}</TableCell>
                <TableCell className="text-center text-[#667085] dark:text-muted-foreground">{rp.format(Number(item.price))}</TableCell>
                <TableCell className="text-center">
                  {item.recipeCount && item.recipeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeMode("view");
                        setRecipeFor(item);
                      }}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      title="Klik untuk lihat resep"
                    >
                      <Badge className="border-0 bg-[#067647]">Lihat Resep</Badge>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRecipeMode("edit");
                        setRecipeFor(item);
                      }}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      title="Klik untuk tambah resep"
                    >
                      <Badge
                        variant="outline"
                        className="border-[#d0d5dd] text-[#344054] hover:bg-[#f9fafb]"
                      >
                        + Tambah Resep
                      </Badge>
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2.5">
                    <Badge
                      className={`border-0 text-white ${item.available ? "bg-[#067647]" : "bg-[#667085]"}`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                    <Switch
                      checked={item.available}
                      onCheckedChange={(v) => toggleAvailable(item, v)}
                      aria-label={`Toggle ${item.name}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Aksi ${item.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRecipeMode("edit");
                          setRecipeFor(item);
                        }}
                      >
                        Kelola Resep
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[#d92d20] focus:text-[#d92d20]"
                        onClick={() => setDeleting(item)}
                      >
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit */}
      <MenuFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        categories={categories}
        onSaved={refetch}
      />

      {/* Kelola Resep */}
      <RecipeDialog
        item={recipeFor}
        mode={recipeMode}
        onOpenChange={() => setRecipeFor(null)}
        onSaved={refetch}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Menu item akan dihapus permanen. Item yang sudah dipakai di order tidak ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#d92d20] text-white hover:bg-[#b42318]"
              onClick={() => deleting && remove(deleting)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
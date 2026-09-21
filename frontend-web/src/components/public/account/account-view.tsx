"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ListOrdered, Loader2, LogOut, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { meService, logout } from "@/services/me-service";
import type { Order, Reservation, User } from "@/lib/types";
import { rp } from "@/lib/format";

const TABS = [
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "orders", label: "Orders", icon: ListOrdered },
  { key: "reservations", label: "Reservations", icon: CalendarDays },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Status → warna badge (warm bistro palette).
function statusBadge(status: string) {
  if (status === "COMPLETED" || status === "CONFIRMED" || status === "PAID" || status === "SERVED")
    return "bg-[#e7f2ec] text-[#2f7a52]";
  if (status === "CANCELLED" || status === "REJECTED") return "bg-[#fbeaea] text-[#c0392b]";
  return "bg-[#f1ead9] text-[#b8521f]";
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function AccountView({ user: initialUser }: { user: User }) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab") as TabKey | null;
  const [tab, setTab] = useState<TabKey>(
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : "profile",
  );
  const [user, setUser] = useState(initialUser);

  const doLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.replace("/");
  };

  return (
    <div className="flex-1 bg-white font-sans text-[#2b2119]">
      {/* Layout gaya GitHub Settings: kolom menu vertikal + konten, dalam container normal */}
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl gap-10 px-6 py-10">
        {/* Kiri — profil mini + menu vertikal */}
        <aside className="w-56 shrink-0">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.name} className="size-11 rounded-full object-cover" />
            ) : (
              <span className="grid size-11 place-items-center rounded-full bg-[#b8521f] text-base font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-[#5c5147]">{user.email}</p>
            </div>
          </div>

          <nav className="mt-5 grid gap-1 border-t border-[#f0e8de] pt-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  tab === t.key
                    ? "bg-[#f7ece4] font-semibold text-[#2b2119]"
                    : "text-[#5c5147] hover:bg-[#faf6f0] hover:text-[#2b2119]"
                }`}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            ))}
            <button
              onClick={doLogout}
              className="mt-2 flex items-center gap-3 rounded-lg border-t border-[#f0e8de] px-3 pt-3 pb-2 text-sm text-[#5c5147] transition-colors hover:text-[#c0392b]"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Kanan — konten tab aktif */}
        <main className="min-w-0 flex-1">
          {tab === "orders" && <OrdersTab />}
          {tab === "reservations" && <ReservationsTab />}
          {tab === "profile" && <ProfileTab user={user} onUser={setUser} />}
        </main>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    meService.orders().then(setOrders).catch(() => setFailed(true));
  }, []);

  const cancel = async (id: number) => {
    setCancelling(id);
    await meService
      .cancelOrder(id)
      .then(() => meService.orders().then(setOrders))
      .catch((e: Error) => toast.error(e.message));
    setCancelling(null);
  };

  if (failed)
    return <p className="text-sm text-[#c0392b]">Failed to load orders — refresh to try again.</p>;
  if (!orders) return <p className="text-sm text-[#5c5147]">Loading orders…</p>;
  if (orders.length === 0)
    return (
      <div className="rounded-2xl border border-[#f0e8de] p-10 text-center">
        <p className="font-brand text-xl font-semibold">No orders yet</p>
        <p className="mt-1 text-sm text-[#5c5147]">
          Orders you place while signed in will show up here.
        </p>
        <Link
          href="/menu"
          className={`mt-4 inline-block rounded-lg bg-[#b8521f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9c4519]`}
        >
          Browse Menu
        </Link>
      </div>
    );

  return (
    <>
      <h1 className="font-brand text-3xl font-semibold">My Orders</h1>
      <div className="mt-6 grid gap-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-[#f0e8de] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-brand text-lg font-semibold">{o.code}</p>
                <p className="text-xs text-[#5c5147]" suppressHydrationWarning>
                  {fmtDate(o.createdAt)}
                  {o.table ? ` · Table ${o.table.number}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(o.status)}`}>
                  {o.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(o.paymentStatus)}`}>
                  {o.paymentStatus}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#5c5147]">
              {o.items.map((i) => `${i.qty}× ${i.menuItem.name}`).join(", ")}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e8de] pt-4">
              <p className="font-brand text-lg font-semibold text-[#b8521f]">{rp.format(o.total)}</p>
              <div className="flex items-center gap-2">
                {o.trackingToken && (
                  <Link
                    href={`/track/${o.trackingToken}`}
                    className="rounded-lg bg-[#f1ead9] px-3 py-1.5 text-xs font-semibold text-[#2b2119] hover:bg-[#e9dfca]"
                  >
                    Track
                  </Link>
                )}
                {o.status === "PENDING" && o.paymentStatus === "UNPAID" && (
                  <button
                    onClick={() => cancel(o.id)}
                    disabled={cancelling === o.id}
                    className="rounded-lg border border-[#fbeaea] px-3 py-1.5 text-xs font-semibold text-[#c0392b] hover:bg-[#fbeaea] disabled:opacity-60"
                  >
                    {cancelling === o.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ReservationsTab() {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    meService.reservations().then(setReservations).catch(() => setFailed(true));
  }, []);

  const cancel = async (id: number) => {
    setCancelling(id);
    await meService
      .changeReservationStatus(id, "CANCELLED")
      .then(() => meService.reservations().then(setReservations))
      .catch((e: Error) => toast.error(e.message));
    setCancelling(null);
  };

  if (failed)
    return <p className="text-sm text-[#c0392b]">Failed to load reservations — refresh to try again.</p>;
  if (!reservations) return <p className="text-sm text-[#5c5147]">Loading reservations…</p>;
  if (reservations.length === 0)
    return (
      <div className="rounded-2xl border border-[#f0e8de] p-10 text-center">
        <p className="font-brand text-xl font-semibold">No reservations yet</p>
        <p className="mt-1 text-sm text-[#5c5147]">Book a table without a phone call.</p>
        <Link
          href="/reservasi"
          className="mt-4 inline-block rounded-lg bg-[#b8521f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9c4519]"
        >
          Reserve a Table
        </Link>
      </div>
    );

  return (
    <>
      <h1 className="font-brand text-3xl font-semibold">My Reservations</h1>
      <div className="mt-6 grid gap-4">
        {reservations.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f0e8de] bg-white p-5"
          >
            <div>
              <p className="text-base font-semibold">
                {fmtDate(r.date)} · {r.slot}
              </p>
              <p className="mt-0.5 text-xs text-[#5c5147]">
                {r.guests} guest{r.guests > 1 ? "s" : ""}
                {r.table ? ` · Table ${r.table.number}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(r.status)}`}>
                {r.status}
              </span>
              {r.status === "PENDING" && (
                <button
                  onClick={() => cancel(r.id)}
                  disabled={cancelling === r.id}
                  className="rounded-lg border border-[#fbeaea] px-3 py-1.5 text-xs font-semibold text-[#c0392b] hover:bg-[#fbeaea] disabled:opacity-60"
                >
                  {cancelling === r.id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProfileTab({ user, onUser }: { user: User; onUser: (u: User) => void }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!name.trim() || name.trim() === user.name) return;
    setSaving(true);
    await meService
      .updateProfile(name.trim())
      .then((u) => {
        onUser(u);
        toast.success("Profile saved");
        router.refresh();
      })
      .catch((e: Error) => toast.error(e.message));
    setSaving(false);
  };

  const upload = async (file: File) => {
    setUploading(true);
    await meService
      .uploadAvatar(file)
      .then(() => meService.profile().then(onUser))
      .then(() => toast.success("Avatar updated"))
      .catch((e: Error) => toast.error(e.message));
    setUploading(false);
  };

  return (
    <>
      <h1 className="font-brand text-2xl font-semibold">Profile</h1>

      {/* Avatar */}
      <div className="mt-5 flex items-center gap-3">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={user.name} className="size-16 rounded-full object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-[#b8521f] text-xl font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-[#f1ead9] px-3 py-1.5 text-xs font-semibold text-[#2b2119] hover:bg-[#e9dfca] disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          <p className="mt-1 text-xs text-[#5c5147]">JPG or PNG.</p>
        </div>
      </div>

      {/* Form */}
      <div className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email <span className="text-xs font-normal text-[#5c5147]">(cannot be changed)</span>
          <input
            value={user.email}
            readOnly
            className="h-10 rounded-lg border border-[#f0e8de] bg-[#faf6f0] px-3 text-sm font-normal text-[#5c5147]"
          />
        </label>
        <button
          onClick={save}
          disabled={saving || !name.trim() || name.trim() === user.name}
          className="h-10 w-full rounded-lg bg-[#b8521f] text-sm font-semibold text-white hover:bg-[#9c4519] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </>
  );
}
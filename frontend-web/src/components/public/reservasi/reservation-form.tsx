"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { reservationsService, type TableAvailability } from "@/services/reservations-service";

// Harus sama dengan SLOTS di server (validators/reservations.ts).
const SLOTS = ["11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
const GUESTS = [2, 4, 6, 8, 10];

const DAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const FULL_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(30),
});
type ReservationForm = z.infer<typeof formSchema>;

export function ReservationForm() {
  const [days] = useState<Date[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    }),
  );
  const [slot, setSlot] = useState(SLOTS[4]); // 19:00 default, sesuai mock
  const [guests, setGuests] = useState(4);
  const [tables, setTables] = useState<TableAvailability[] | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);

  // Auto-pilih meja kosong pertama — tombol Reservasi selalu siap (derive saat render).
  const selectedId =
    tableId && tables?.some((t) => t.id === tableId && !t.reserved)
      ? tableId
      : tables?.find((t) => !t.reserved)?.id ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [date, setDate] = useState<Date | null>(null);

  const dateKey = date?.toISOString().slice(0, 10) ?? "";

  // Real-time availability tiap tanggal/slot berganti (setState hanya di callback).
  useEffect(() => {
    if (!dateKey || !slot) return;
    let alive = true;
    reservationsService
      .availability(dateKey, slot)
      .then((t) => alive && setTables(t))
      .catch(() => alive && setTables([]));
    return () => {
      alive = false;
    };
  }, [dateKey, slot]);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ReservationForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "" },
  });

  const submit = async (data: ReservationForm) => {
    const chosenId = selectedId;
    if (!date || !chosenId) {
      toast.error("All tables are taken in this slot — try another one");
      return;
    }
    setSubmitting(true);
    const res = await reservationsService
      .createGuest({
        tableId: chosenId,
        date: dateKey,
        slot,
        guests: guests === 10 ? 10 : guests,
        name: data.name,
        phone: data.phone,
      })
      .then(() => true)
      .catch((e: Error) => {
        toast.error(
          e.message.includes("409") || e.message.includes("kedua")
            ? "Sorry, someone just took that table — pick another one."
            : e.message,
        );
        setError("name", { message: e.message });
        return false;
      });
    setSubmitting(false);
    if (!res) return;
    setDone(true);
    toast.success(`Table ${tables?.find((t) => t.id === chosenId)?.number ?? ""} is locked in for ${data.name}!`);
    reset();
    void reservationsService.availability(dateKey, slot).then(setTables).catch(() => {});
  };

  if (done) {
    return (
      <div className="w-full rounded-2xl border border-[#e7f2ec] bg-[#e7f2ec] p-10 text-center">
        <p className="font-brand text-3xl font-semibold text-[#2f7a52]">Table locked in! 🎉</p>
        <p className="mt-3 text-sm text-[#5c5147]">
          Your reservation is confirmed for {date ? FULL_FMT.format(date) : ""} at {slot} · {guests} guests.
          See you at the table!
        </p>
        <button
          onClick={() => {
            setDone(false);
            setTableId(null);
          }}
          className="mt-6 rounded-lg border border-[#e4d9cc] bg-white px-5 py-2.5 text-sm font-semibold text-[#2b2119]"
        >
          Reserve another table
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_460px]">
      {/* Form kiri */}
      <div>
        {/* Pilih tanggal */}
        <p className="text-sm font-semibold text-[#2b2119]">Pick a Date</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {days.map((d) => {
            const active = date?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toDateString()}
                onClick={() => setDate(d)}
                className={`grid w-16 place-items-center rounded-xl border px-2 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-[#b8521f] bg-[#b8521f] text-white"
                    : "border-[#e4d9cc] bg-white text-[#2b2119] hover:border-[#b8521f]"
                }`}
              >
                <span className={`text-[11px] ${active ? "text-white/80" : "text-[#5c5147]"}`}>
                  {DAY_FMT.format(d)}
                </span>
                <span className="text-base font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* Kontak */}
        <p className="mt-8 text-xs font-semibold tracking-[2px] text-[#b8521f]">CONTACT</p>
        <form onSubmit={handleSubmit(submit)} className="mt-3 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#2b2119]">Name</label>
              <input
                placeholder="Your full name"
                className="mt-2 h-12 w-full rounded-lg border border-[#e4d9cc] bg-white px-4 text-sm outline-none focus:border-[#b8521f]"
                {...register("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-[#c0392b]">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-[#2b2119]">Phone Number</label>
              <input
                placeholder="+62 812-xxxx-xxxx"
                className="mt-2 h-12 w-full rounded-lg border border-[#e4d9cc] bg-white px-4 text-sm outline-none focus:border-[#b8521f]"
                {...register("phone")}
              />
              {errors.phone && <p className="mt-1 text-xs text-[#c0392b]">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Slot */}
          <div>
            <label className="text-sm font-medium text-[#2b2119]">Time Slot{date && ` · ${FULL_FMT.format(date).split(",")[0]} ${date.getDate()} ${date.toLocaleDateString("en-US", { month: "short" })}`}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    slot === s
                      ? "border-[#b8521f] bg-[#b8521f] text-white"
                      : "border-[#e4d9cc] bg-white text-[#2b2119] hover:border-[#b8521f]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah orang */}
          <div>
            <label className="text-sm font-medium text-[#2b2119]">Party Size</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {GUESTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGuests(g)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    guests === g
                      ? "border-[#b8521f] bg-[#b8521f] text-white"
                      : "border-[#e4d9cc] bg-white text-[#2b2119] hover:border-[#b8521f]"
                  }`}
                >
                  {g === 10 ? "10+ guests" : `${g} guests`}
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan */}
          <div className="rounded-xl bg-[#f7ece4] px-6 py-5">
            <p className="text-sm font-semibold text-[#2b2119]">
              {date ? FULL_FMT.format(date) : "Select a date"} · {slot} ·{" "}
              {guests === 10 ? "10+" : guests} guests
            </p>
            <p className="mt-1 text-xs text-[#5c5147]">
              Available — instant confirmation upon submit.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedId}
            className="w-fit rounded-xl bg-[#b8521f] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-50"
          >
            {submitting ? "Locking your table…" : "Reserve Now"}
          </button>
        </form>
      </div>

      {/* Availability kanan */}
      <div className="rounded-2xl border border-[#f0e8de] bg-white p-6">
        <p className="font-brand text-2xl font-semibold text-[#2b2119]">Available tables · {slot}</p>
        <p className="mt-1 text-sm text-[#5c5147]">Real-time from the reservation system.</p>
        <div className="mt-5 grid gap-4">
          {tables === null && <p className="text-sm text-[#5c5147]">Loading…</p>}
          {tables?.length === 0 && <p className="text-sm text-[#5c5147]">No tables registered yet.</p>}
          {tables?.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={t.reserved}
              onClick={() => setTableId(t.id)}
              className={`flex items-center justify-between border-b border-[#f0e8de] pb-3 text-left transition-colors last:border-0 ${
                t.reserved ? "cursor-not-allowed opacity-50" : "hover:opacity-80"
              }`}
            >
              <p className={`text-base font-semibold ${selectedId === t.id ? "text-[#b8521f]" : "text-[#2b2119]"}`}>
                T-{String(t.number).padStart(2, "0")}
                {selectedId === t.id && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-[#b8521f]">
                    <Check className="size-3.5" /> Selected
                  </span>
                )}
              </p>
              <p className="text-sm text-[#5c5147]">
                {t.capacity} guests{" "}
                <span className={`ml-2 font-medium ${t.reserved ? "text-[#c0392b]" : "text-[#2f7a52]"}`}>
                  {t.reserved ? "Taken" : "Available"}
                </span>
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-[#f0e8de] pt-5 dark:border-white/10">
          <p className="text-sm font-semibold text-[#2b2119]">How it works</p>
          <ol className="mt-2 grid gap-1 text-sm text-[#5c5147]">
            <li>1. Pick a date &amp; slot</li>
            <li>2. Enter your name &amp; phone</li>
            <li>3. Instant confirmation — your table is locked in</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

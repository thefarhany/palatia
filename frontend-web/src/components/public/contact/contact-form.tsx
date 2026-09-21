"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS } from "@/lib/types/contact";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("That email doesn't look right — check it again."),
  phone: z.string().max(30).optional(),
  message: z.string().min(1, "Message is required").max(2000),
});
type ContactForm = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [topic, setTopic] = useState("General");
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  // ponytail: belum ada endpoint backend untuk pesan kontak — simulasikan sukses.
  const onSubmit = async (data: ContactForm) => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    toast.success(`Message sent — "${data.name}", we'll reply within 24 hours.`);
    reset();
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">TOPIC</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONTACT_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              topic === t
                ? "bg-[#b8521f] text-white"
                : "border border-[#e4d9cc] bg-white text-[#5c5147] hover:border-[#b8521f]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid max-w-xl gap-5" noValidate>
        <div>
          <label className="text-sm font-medium text-[#2b2119]">Name</label>
          <Input
            placeholder="Your name"
            className="mt-2 h-11 rounded-lg border-[#e4d9cc] focus-visible:border-[#b8521f] focus-visible:ring-[#b8521f]/20"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-xs text-[#c0392b]">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-[#2b2119]">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            className="mt-2 h-11 rounded-lg border-[#e4d9cc] focus:border-[#b8521f]"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-[#c0392b]">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-[#2b2119]">Phone</label>
          <Input
            type="tel"
            placeholder="+62 812-xxxx-xxxx"
            className="mt-2 h-11 rounded-lg border-[#e4d9cc] focus:border-[#b8521f]"
            {...register("phone")}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#2b2119]">Message</label>
          <Textarea
            placeholder="Tell us what you need..."
            rows={6}
            className="mt-2 rounded-lg border-[#e4d9cc] focus:border-[#b8521f]"
            {...register("message")}
          />
          {errors.message && <p className="mt-1 text-xs text-[#c0392b]">{errors.message.message ?? String(errors.message)}</p>}
        </div>
        <div>
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[#b8521f] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}

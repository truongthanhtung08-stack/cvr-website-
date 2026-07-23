"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImageFile } from "@/lib/uploadImage";
import { asset } from "@/lib/asset";
import { homeBanners, type Banner } from "@/lib/banners";
import { FOOTER_DEFAULT, type FooterData } from "@/lib/siteContent";

// Quản lý NỘI DUNG TĨNH trang web (chữ + ảnh) — Hero trang chủ + Footer công ty.
// Lưu vào bảng site_content (key: 'hero_home', 'footer'). Web đọc no-store → hiện ngay.
export default function AdminSiteContentPage() {
  const [heroSlides, setHeroSlides] = useState<Banner[]>(homeBanners);
  const [footer, setFooter] = useState<FooterData>(FOOTER_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_content").select("key,data").in("key", ["hero_home", "footer"]);
      const rows = (data ?? []) as { key: string; data: Record<string, unknown> }[];
      const h = rows.find((r) => r.key === "hero_home")?.data as { slides?: Banner[] } | undefined;
      if (h?.slides?.length) setHeroSlides(h.slides);
      const f = rows.find((r) => r.key === "footer")?.data as Partial<FooterData> | undefined;
      if (f) setFooter({
        ...FOOTER_DEFAULT, ...f,
        socials: f.socials?.length ? f.socials : FOOTER_DEFAULT.socials,
        images: f.images?.length ? f.images : FOOTER_DEFAULT.images,
      });
      setLoading(false);
    })();
  }, []);

  async function saveBlock(key: string, data: unknown, setSaving: (b: boolean) => void) {
    setMsg("");
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_content").upsert({ key, data });
    setSaving(false);
    setMsg(error ? `Lưu thất bại: ${error.message}` : "✓ Đã lưu — web cập nhật ngay.");
  }

  const setSlide = (i: number, patch: Partial<Banner>) =>
    setHeroSlides((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setFooterImg = (i: number, src: string) =>
    setFooter((f) => ({ ...f, images: f.images.map((im, j) => (j === i ? { ...im, src } : im)) }));
  const setSocial = (i: number, href: string) =>
    setFooter((f) => ({ ...f, socials: f.socials.map((s, j) => (j === i ? { ...s, href } : s)) }));

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Nội dung web</h1>
        <p className="mt-1 text-sm text-cvr-muted">Sửa ảnh &amp; chữ phần cứng của web. Bấm <strong>Lưu</strong> ở từng khối → web cập nhật ngay.</p>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ${msg.startsWith("✓") ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-red-50 text-red-700 ring-red-600/20"}`}>{msg}</p>
      )}

      {/* HERO TRANG CHỦ */}
      <Card title="Hero trang chủ (3 slide)" note="Ảnh ngang 16:9 · nên 1920 × 1080 px">
        <div className="space-y-5">
          {heroSlides.map((s, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-4">
              <p className="mb-3 text-sm font-semibold text-cvr-ink">Slide {i + 1}</p>
              <ImageField value={s.image} ratio="16:9 · 1920×1080" onChange={(url) => setSlide(i, { image: url })} />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nhãn (dòng 1)"><input value={s.status ?? ""} onChange={(e) => setSlide(i, { status: e.target.value })} className={inputCls} /></Field>
                <Field label="Tiêu đề (dòng 2)"><input value={s.title ?? ""} onChange={(e) => setSlide(i, { title: e.target.value })} className={inputCls} /></Field>
                <Field label="Mô tả (dòng 3)"><input value={s.subtitle ?? ""} onChange={(e) => setSlide(i, { subtitle: e.target.value })} className={inputCls} /></Field>
                <Field label="Nút CTA (bỏ trống = ẩn nút)"><input value={s.cta ?? ""} onChange={(e) => setSlide(i, { cta: e.target.value })} className={inputCls} /></Field>
                <Field label="Link khi bấm (href)"><input value={s.href ?? ""} onChange={(e) => setSlide(i, { href: e.target.value })} placeholder="/du-an/... hoặc /landing/..." className={inputCls} /></Field>
              </div>
            </div>
          ))}
        </div>
        <SaveButton saving={savingHero} onClick={() => saveBlock("hero_home", { slides: heroSlides }, setSavingHero)} />
      </Card>

      {/* FOOTER */}
      <Card title="Footer — thông tin công ty" note="3 ảnh minh hoạ tỷ lệ 4:3 · nên 800 × 600 px">
        <div className="space-y-4">
          <Field label="Dòng đậm (tagline)"><input value={footer.tagline} onChange={(e) => setFooter({ ...footer, tagline: e.target.value })} className={inputCls} /></Field>
          <Field label="Giới thiệu ngắn"><textarea value={footer.description} onChange={(e) => setFooter({ ...footer, description: e.target.value })} rows={2} className={`${inputCls} h-auto py-2.5`} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Hotline"><input value={footer.hotline} onChange={(e) => setFooter({ ...footer, hotline: e.target.value })} className={inputCls} /></Field>
            <Field label="Email"><input value={footer.email} onChange={(e) => setFooter({ ...footer, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Địa chỉ"><input value={footer.address} onChange={(e) => setFooter({ ...footer, address: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Tên pháp lý (dòng cuối)"><input value={footer.company} onChange={(e) => setFooter({ ...footer, company: e.target.value })} className={inputCls} /></Field>

          <div>
            <p className="mb-2 text-sm font-medium text-cvr-body">Link mạng xã hội</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {footer.socials.map((s, i) => (
                <Field key={s.label} label={s.label}><input value={s.href} onChange={(e) => setSocial(i, e.target.value)} placeholder="https://…" className={inputCls} /></Field>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-cvr-body">3 ảnh minh hoạ (4:3 · 800×600)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {footer.images.map((im, i) => (
                <ImageField key={i} value={im.src} ratio="4:3 · 800×600" onChange={(url) => setFooterImg(i, url)} />
              ))}
            </div>
          </div>
        </div>
        <SaveButton saving={savingFooter} onClick={() => saveBlock("footer", footer, setSavingFooter)} />
      </Card>

      <p className="text-xs text-cvr-faint">
        Các khối khác (khu vực, tin tức, banner, giới thiệu…) sẽ được thêm vào đây theo cùng cách. Ảnh tải lên lưu ở Supabase, không đụng GitHub.
      </p>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

// Ô ảnh: xem trước + nút tải + ghi rõ TỶ LỆ cần dùng.
function ImageField({ value, ratio, onChange }: { value: string; ratio: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [up, setUp] = useState(false);
  const [err, setErr] = useState("");
  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setErr(""); setUp(true);
    const { url, error } = await uploadImageFile(file);
    setUp(false);
    if (error) return setErr(error);
    if (url) onChange(url);
    if (ref.current) ref.current.value = "";
  }
  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-cvr-line bg-cvr-surface">
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={asset(value)} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-cvr-faint">Chưa có ảnh</div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">Tỷ lệ {ratio}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={up} className="rounded-lg border border-cvr-line bg-white px-3 py-1.5 text-xs font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60">
          {up ? "Đang tải…" : value ? "Đổi ảnh" : "Tải ảnh"}
        </button>
        <input ref={ref} type="file" accept="image/*" onChange={(e) => pick(e.target.files)} className="hidden" />
      </div>
      {err && <p className="mt-1 text-xs font-medium text-red-600">{err}</p>}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="mt-4 rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50">
      {saving ? "Đang lưu…" : "Lưu khối này"}
    </button>
  );
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cvr-line bg-white p-5 shadow-lux">
      <h2 className="text-base font-semibold text-cvr-ink">{title}</h2>
      {note && <p className="mb-4 mt-0.5 text-xs text-cvr-faint">{note}</p>}
      {!note && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cvr-body">{label}</span>
      {children}
    </label>
  );
}

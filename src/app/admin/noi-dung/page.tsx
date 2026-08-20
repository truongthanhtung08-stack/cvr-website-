"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadImageFile } from "@/lib/uploadImage";
import { asset } from "@/lib/asset";
import { homeBanners, projectBanners, type Banner } from "@/lib/banners";
import { landings as LANDINGS_DEFAULT, type Landing } from "@/lib/landings";
import { FOOTER_DEFAULT, HOME_AD_DEFAULT, HOME_AREAS_DEFAULT, ABOUT_DEFAULT, type FooterData, type HomeAdData, type AreaCard, type AboutData } from "@/lib/siteContent";
import { PHAP_LY } from "@/lib/phapLy";
import { Panel, Field } from "@/components/Ui";

// Quản lý NỘI DUNG TĨNH trang web (chữ + ảnh) — Hero trang chủ + Footer công ty.
// Lưu vào bảng site_content (key: 'hero_home', 'footer'). Web đọc no-store → hiện ngay.
export default function AdminSiteContentPage() {
  const [heroSlides, setHeroSlides] = useState<Banner[]>(homeBanners);
  const [footer, setFooter] = useState<FooterData>(FOOTER_DEFAULT);
  const [homeAd, setHomeAd] = useState<HomeAdData>(HOME_AD_DEFAULT);
  const [projBanners, setProjBanners] = useState<Banner[]>(projectBanners);
  const [landings, setLandings] = useState<Landing[]>(LANDINGS_DEFAULT);
  const [homeAreas, setHomeAreas] = useState<AreaCard[]>(HOME_AREAS_DEFAULT);
  const [about, setAbout] = useState<AboutData>(ABOUT_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingFooter, setSavingFooter] = useState(false);
  const [savingAd, setSavingAd] = useState(false);
  const [savingProj, setSavingProj] = useState(false);
  const [savingLanding, setSavingLanding] = useState(false);
  const [savingAreas, setSavingAreas] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_content").select("key,data")
        .in("key", ["hero_home", "footer", "home_ad", "banner_projects", "landings", "home_areas", "about"]);
      const rows = (data ?? []) as { key: string; data: Record<string, unknown> }[];
      const pick = (k: string) => rows.find((r) => r.key === k)?.data;

      const h = pick("hero_home") as { slides?: Banner[] } | undefined;
      if (h?.slides?.length) setHeroSlides(h.slides);

      const f = pick("footer") as Partial<FooterData> | undefined;
      if (f) setFooter({
        ...FOOTER_DEFAULT, ...f,
        socials: f.socials?.length ? f.socials : FOOTER_DEFAULT.socials,
        images: f.images?.length ? f.images : FOOTER_DEFAULT.images,
      });

      const ad = pick("home_ad") as Partial<HomeAdData> | undefined;
      if (ad) setHomeAd({
        seller: { ...HOME_AD_DEFAULT.seller, ...ad.seller },
        app: { ...HOME_AD_DEFAULT.app, ...ad.app },
      });

      const pb = pick("banner_projects") as { slides?: Banner[] } | undefined;
      if (pb?.slides?.length) setProjBanners(pb.slides);

      const ld = pick("landings") as { items?: Landing[] } | undefined;
      if (ld?.items?.length) setLandings(ld.items);

      const ar = pick("home_areas") as { items?: AreaCard[] } | undefined;
      if (ar?.items?.length) setHomeAreas(ar.items);

      const ab = pick("about") as Partial<AboutData> | undefined;
      if (ab) setAbout({
        ...ABOUT_DEFAULT, ...ab,
        story: { ...ABOUT_DEFAULT.story, ...ab.story },
        market: { ...ABOUT_DEFAULT.market, ...ab.market },
        cta: { ...ABOUT_DEFAULT.cta, ...ab.cta },
        values: ab.values?.length ? ab.values : ABOUT_DEFAULT.values,
        stats: ab.stats?.length ? ab.stats : ABOUT_DEFAULT.stats,
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
  const setSocial = (i: number, href: string) =>
    setFooter((f) => ({ ...f, socials: f.socials.map((s, j) => (j === i ? { ...s, href } : s)) }));
  const setSeller = (patch: Partial<HomeAdData["seller"]>) =>
    setHomeAd((a) => ({ ...a, seller: { ...a.seller, ...patch } }));
  const setApp = (patch: Partial<HomeAdData["app"]>) =>
    setHomeAd((a) => ({ ...a, app: { ...a.app, ...patch } }));
  const setProj = (i: number, patch: Partial<Banner>) =>
    setProjBanners((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addProj = () =>
    setProjBanners((s) => [...s, { id: `slide-${s.length + 1}`, image: "", title: "" }]);
  const delProj = (i: number) => setProjBanners((s) => s.filter((_, j) => j !== i));
  const setLd = (i: number, patch: Partial<Landing>) =>
    setLandings((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addLd = () =>
    setLandings((s) => [...s, { slug: "", image: "", eyebrow: "", title: "", subtitle: "", intro: "", stats: [], blocks: [], gallery: [], ctaLabel: "", ctaHref: "" }]);
  const delLd = (i: number) => setLandings((s) => s.filter((_, j) => j !== i));
  const setArea = (i: number, patch: Partial<AreaCard>) =>
    setHomeAreas((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addArea = () =>
    setHomeAreas((s) => [...s, { name: "", count: "", image: "", href: "/mua-ban" }]);
  const delArea = (i: number) => setHomeAreas((s) => s.filter((_, j) => j !== i));
  // Ảnh chạy slide thêm của 1 ô khu vực (ngoài ảnh chính)
  const setAreaImg = (i: number, k: number, url: string) =>
    setArea(i, { images: (homeAreas[i].images ?? []).map((x, j) => (j === k ? url : x)) });
  const addAreaImg = (i: number) => setArea(i, { images: [...(homeAreas[i].images ?? []), ""] });
  const delAreaImg = (i: number, k: number) =>
    setArea(i, { images: (homeAreas[i].images ?? []).filter((_, j) => j !== k) });

  if (loading) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Nội dung web</h1>
        <p className="mt-1 text-sm text-cvr-muted">Sửa ảnh &amp; chữ phần cứng của web. Bấm <strong>Lưu</strong> ở từng khối → web cập nhật ngay.</p>
      </div>

      {msg && (
        <p className={`rounded-lg px-4 py-2.5 text-sm font-medium ring-1 ring-inset ${msg.startsWith("✓") ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-red-50 text-red-700 ring-red-600/20"}`}>{msg}</p>
      )}

      {/* HERO TRANG CHỦ */}
      <Panel title="Hero trang chủ (3 slide)" desc="Mỗi slide cần 2 ảnh: MÁY TÍNH 2560×1280 (2:1) và ĐIỆN THOẠI 1200×480 (2.5:1)">
        <div className="space-y-4">
          {heroSlides.map((s, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-4">
              <p className="mb-3 text-sm font-semibold text-cvr-ink">Slide {i + 1}</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-cvr-ink">Ảnh MÁY TÍNH</p>
                  <p className="mb-2 mt-0.5 inline-block rounded-md bg-cvr-blue/10 px-2.5 py-1 text-[15px] font-bold tracking-tight text-cvr-blue-ink">
                    2560 × 1280 px · tỷ lệ 2 : 1
                  </p>
                  <ImageField value={s.image} ratio="2:1 · 2560×1280" onChange={(url) => setSlide(i, { image: url })} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cvr-ink">Ảnh ĐIỆN THOẠI</p>
                  <p className="mb-2 mt-0.5 inline-block rounded-md bg-cvr-blue/10 px-2.5 py-1 text-[15px] font-bold tracking-tight text-cvr-blue-ink">
                    1200 × 480 px · tỷ lệ 2,5 : 1
                  </p>
                  <ImageField value={s.imageMobile ?? ""} ratio="2.5:1 · 1200×480" onChange={(url) => setSlide(i, { imageMobile: url })} />
                  <p className="mt-1 text-xs text-cvr-muted">Bỏ trống → điện thoại dùng tạm ảnh máy tính (sẽ bị cắt)</p>
                </div>
              </div>
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
      </Panel>

      {/* BẤT ĐỘNG SẢN THEO KHU VỰC (trang chủ)
          Khung ô là NGANG — LocationGrid để ô cao 8rem (điện thoại) / 11rem (máy tính),
          rộng gấp 1,3–2,7 lần chiều cao. Nhãn cũ ghi "ảnh dọc 800×800" là SAI: ảnh vuông
          tải lên sẽ bị cắt cụt trên–dưới. */}
      <Panel title="Bất động sản theo khu vực (trang chủ)" desc="5 ô · ô ĐẦU hiển thị LỚN (địa điểm nổi bật). Ảnh NGANG tỷ lệ 3:2 · nên 1200 × 800 px">
        <div className="space-y-4">
          {homeAreas.map((a, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-cvr-ink">Ô {i + 1}{i === 0 ? " (lớn — nổi bật)" : ""}</p>
                <button type="button" onClick={() => delArea(i)} className="text-xs font-medium text-red-600 hover:underline">Xoá</button>
              </div>
              <ImageField value={a.image} ratio="Ngang 3:2 · 1200×800" onChange={(url) => setArea(i, { image: url })} />

              {/* Ảnh chạy slide thêm — ô khu vực tự đổi ảnh 5 giây/lần */}
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-cvr-body">Ảnh chạy slide thêm (ngoài ảnh chính)</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(a.images ?? []).map((src, k) => (
                    <div key={k}>
                      <ImageField value={src} ratio="Ngang 3:2 · 1200×800" onChange={(url) => setAreaImg(i, k, url)} />
                      <button type="button" onClick={() => delAreaImg(i, k)} className="mt-1 text-xs font-medium text-red-600 hover:underline">Xoá ảnh</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addAreaImg(i)} className={`${addBtnCls} mt-3`}>+ Thêm ảnh</button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tên khu vực"><input value={a.name} onChange={(e) => setArea(i, { name: e.target.value })} className={inputCls} /></Field>
                <Field label="Dòng phụ (vd '1.240 tin')"><input value={a.count} onChange={(e) => setArea(i, { count: e.target.value })} className={inputCls} /></Field>
                <Field label="Link khi bấm (href)"><input value={a.href} onChange={(e) => setArea(i, { href: e.target.value })} placeholder="/mua-ban?tinh=Đà Nẵng" className={inputCls} /></Field>
              </div>
            </div>
          ))}
          <button type="button" onClick={addArea} className={addBtnCls}>+ Thêm khu vực</button>
        </div>
        <SaveButton saving={savingAreas} onClick={() => saveBlock("home_areas", { items: homeAreas }, setSavingAreas)} />
      </Panel>

      {/* FOOTER */}
      <Panel title="Footer — thông tin công ty" desc="Hotline · email · link mạng xã hội. Địa chỉ và thông tin pháp lý nay nằm trong src/lib/phapLy.ts">
        <div className="space-y-4">
          <Field label="Dòng đậm (tagline)"><input value={footer.tagline} onChange={(e) => setFooter({ ...footer, tagline: e.target.value })} className={inputCls} /></Field>
          <Field label="Giới thiệu ngắn"><textarea value={footer.description} onChange={(e) => setFooter({ ...footer, description: e.target.value })} rows={2} className={`${inputCls} h-auto py-2.5`} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Hỗ trợ kỹ thuật (số điện thoại)"><input value={footer.hotline} onChange={(e) => setFooter({ ...footer, hotline: e.target.value })} className={inputCls} /></Field>
            <Field label="Email"><input value={footer.email} onChange={(e) => setFooter({ ...footer, email: e.target.value })} className={inputCls} /></Field>
            {/* Địa chỉ đã chuyển hẳn sang src/lib/phapLy.ts (một nguồn duy nhất cho footer,
                trang Liên hệ và Quy chế) → ô này KHÔNG còn tác dụng, khoá lại để khỏi sửa nhầm. */}
            <Field label="Địa chỉ (sửa trong src/lib/phapLy.ts)">
              <input value={footer.address} disabled className={`${inputCls} cursor-not-allowed bg-cvr-surface text-cvr-faint`} />
            </Field>
          </div>
          {/* Tên pháp lý phải khớp TỪNG CHỮ với giấy ĐKKD → lấy từ src/lib/phapLy.ts,
              khoá ô này lại (cùng cách đã làm với ô Địa chỉ) để không sửa lệch giấy phép. */}
          <Field label="Tên pháp lý (sửa trong src/lib/phapLy.ts)">
            <input value={PHAP_LY.tenCongTy || footer.company} disabled className={`${inputCls} cursor-not-allowed bg-cvr-surface text-cvr-faint`} />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-cvr-body">Link mạng xã hội</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {footer.socials.map((s, i) => (
                <Field key={s.label} label={s.label}><input value={s.href} onChange={(e) => setSocial(i, e.target.value)} placeholder="https://…" className={inputCls} /></Field>
              ))}
            </div>
          </div>

          {/* 3 ảnh minh hoạ footer: ĐÃ BỎ khỏi giao diện web (yêu cầu file V3 10.08.2026),
              Footer.tsx không còn hiển thị chúng. Bỏ luôn ô sửa ở đây để khỏi tải ảnh lên rồi
              không thấy gì đổi. Dữ liệu cũ vẫn nằm nguyên trong site_content, muốn dùng lại
              thì mở lại khối này + phần hiển thị trong Footer.tsx. */}
        </div>
        <SaveButton saving={savingFooter} onClick={() => saveBlock("footer", footer, setSavingFooter)} />
      </Panel>

      {/* 2 BANNER CUỐI TRANG CHỦ */}
      <Panel title="2 banner cuối trang chủ" desc="Banner 'Đăng tin' (ảnh ngang 3.5:1) + Banner 'Ứng dụng' (ảnh iPhone nền trong · QR)">
        <div className="space-y-4">
          <div className="rounded-xl border border-cvr-line p-4">
            <p className="mb-3 text-sm font-semibold text-cvr-ink">Banner 1 — Đăng tin (nền sáng)</p>
            <ImageField value={homeAd.seller.image} ratio="3.5:1 · 1600×460" onChange={(url) => setSeller({ image: url })} />
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tiêu đề dòng 1"><input value={homeAd.seller.titleLine1} onChange={(e) => setSeller({ titleLine1: e.target.value })} className={inputCls} /></Field>
              <Field label="Tiêu đề dòng 2 (nhấn vàng)"><input value={homeAd.seller.titleLine2} onChange={(e) => setSeller({ titleLine2: e.target.value })} className={inputCls} /></Field>
              <Field label="Nhãn nút CTA"><input value={homeAd.seller.ctaLabel} onChange={(e) => setSeller({ ctaLabel: e.target.value })} className={inputCls} /></Field>
              <Field label="Link nút (href)"><input value={homeAd.seller.ctaHref} onChange={(e) => setSeller({ ctaHref: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="mt-3"><Field label="Mô tả"><textarea value={homeAd.seller.body} onChange={(e) => setSeller({ body: e.target.value })} rows={3} className={`${inputCls} h-auto py-2.5`} /></Field></div>
          </div>

          <div className="rounded-xl border border-cvr-line p-4">
            <p className="mb-3 text-sm font-semibold text-cvr-ink">Banner 2 — Ứng dụng (nền tối)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><span className="mb-1.5 block text-sm font-medium text-cvr-body">Ảnh iPhone (.png nền trong)</span><ImageField value={homeAd.app.phones} ratio="PNG nền trong" onChange={(url) => setApp({ phones: url })} /></div>
              <div><span className="mb-1.5 block text-sm font-medium text-cvr-body">Ảnh mã QR</span><ImageField value={homeAd.app.qr} ratio="Vuông 1:1" onChange={(url) => setApp({ qr: url })} /></div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Tiêu đề dòng 1"><input value={homeAd.app.titleLine1} onChange={(e) => setApp({ titleLine1: e.target.value })} className={inputCls} /></Field>
              <Field label="Tiêu đề dòng 2 (nhấn vàng)"><input value={homeAd.app.titleLine2} onChange={(e) => setApp({ titleLine2: e.target.value })} className={inputCls} /></Field>
              <Field label="Nhãn nút CTA"><input value={homeAd.app.ctaLabel} onChange={(e) => setApp({ ctaLabel: e.target.value })} className={inputCls} /></Field>
              <Field label="Link nút CTA (href)"><input value={homeAd.app.ctaHref} onChange={(e) => setApp({ ctaHref: e.target.value })} className={inputCls} /></Field>
              <Field label="Link App Store"><input value={homeAd.app.appleHref} onChange={(e) => setApp({ appleHref: e.target.value })} placeholder="https://apps.apple.com/…" className={inputCls} /></Field>
              <Field label="Link Google Play"><input value={homeAd.app.googleHref} onChange={(e) => setApp({ googleHref: e.target.value })} placeholder="https://play.google.com/…" className={inputCls} /></Field>
            </div>
            <div className="mt-3"><Field label="Mô tả"><textarea value={homeAd.app.body} onChange={(e) => setApp({ body: e.target.value })} rows={2} className={`${inputCls} h-auto py-2.5`} /></Field></div>
          </div>
        </div>
        <SaveButton saving={savingAd} onClick={() => saveBlock("home_ad", homeAd, setSavingAd)} />
      </Panel>

      {/* BANNER TRANG DỰ ÁN */}
      <Panel title="Banner trang Dự án (/du-an)" desc="Mỗi slide có 2 ô ảnh: MÁY TÍNH 1920×640 (3:1) và ĐIỆN THOẠI 1140×600 (≈1,9:1) · nhiều slide sẽ tự chạy">
        <div className="space-y-4">
          {projBanners.map((s, i) => (
            <div key={i} className="rounded-xl border border-cvr-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-cvr-ink">Slide {i + 1}</p>
                <button type="button" onClick={() => delProj(i)} className="text-xs font-medium text-red-600 hover:underline">Xoá</button>
              </div>
              {/* 2 ô ảnh riêng cho từng loại máy — KHUNG banner giữ nguyên (h-[190px] sm:h-[400px]),
                  chỉ thêm chỗ để nhập ảnh riêng cho điện thoại. */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-cvr-ink">Ảnh MÁY TÍNH</p>
                  <p className="mb-2 mt-0.5 inline-block rounded-md bg-cvr-blue/10 px-2.5 py-1 text-[15px] font-bold tracking-tight text-cvr-blue-ink">
                    1920 × 640 px · tỷ lệ 3 : 1
                  </p>
                  <ImageField value={s.image} ratio="3:1 · 1920×640" onChange={(url) => setProj(i, { image: url })} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cvr-ink">Ảnh ĐIỆN THOẠI</p>
                  <p className="mb-2 mt-0.5 inline-block rounded-md bg-cvr-blue/10 px-2.5 py-1 text-[15px] font-bold tracking-tight text-cvr-blue-ink">
                    1140 × 600 px · tỷ lệ ≈ 1,9 : 1
                  </p>
                  <ImageField value={s.imageMobile ?? ""} ratio="≈1.9:1 · 1140×600" onChange={(url) => setProj(i, { imageMobile: url })} />
                  <p className="mt-1 text-xs text-cvr-muted">Bỏ trống → điện thoại dùng tạm ảnh máy tính</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tiêu đề (tên dự án)"><input value={s.title ?? ""} onChange={(e) => setProj(i, { title: e.target.value })} className={inputCls} /></Field>
                <Field label="Mô tả / địa chỉ"><input value={s.subtitle ?? ""} onChange={(e) => setProj(i, { subtitle: e.target.value })} className={inputCls} /></Field>
                <Field label="Link khi bấm (href)"><input value={s.href ?? ""} onChange={(e) => setProj(i, { href: e.target.value })} placeholder="/du-an/…" className={inputCls} /></Field>
              </div>
            </div>
          ))}
          <button type="button" onClick={addProj} className={addBtnCls}>+ Thêm slide</button>
        </div>
        <SaveButton saving={savingProj} onClick={() => saveBlock("banner_projects", { slides: projBanners }, setSavingProj)} />
      </Panel>

      {/* LANDING PAGES */}
      <Panel title="Landing pages (/landing/…)" desc="Trang đích chạy từ banner Hero. Slug = đoạn cuối đường dẫn, vd 've-coastal-land' → /landing/ve-coastal-land">
        <div className="space-y-4">
          {landings.map((l, i) => (
            <LandingEditor key={i} value={l} index={i} onChange={(patch) => setLd(i, patch)} onDelete={() => delLd(i)} />
          ))}
          <button type="button" onClick={addLd} className={addBtnCls}>+ Thêm landing</button>
        </div>
        <SaveButton saving={savingLanding} onClick={() => saveBlock("landings", { items: landings }, setSavingLanding)} />
      </Panel>

      {/* TRANG GIỚI THIỆU CÔNG TY */}
      <Panel title="Trang Giới thiệu công ty (/gioi-thieu)" desc="Toàn bộ nội dung trang: câu chuyện · tầm nhìn/sứ mệnh · giá trị cốt lõi · số liệu · thị trường · CTA">
        <AboutEditor value={about} onChange={(patch) => setAbout((a) => ({ ...a, ...patch }))} />
        <SaveButton saving={savingAbout} onClick={() => saveBlock("about", about, setSavingAbout)} />
      </Panel>

      <p className="text-xs text-cvr-faint">
        Các khối khác (khu vực, tin tức, banner, giới thiệu…) sẽ được thêm vào đây theo cùng cách. Ảnh tải lên lưu ở Supabase, không đụng GitHub.
      </p>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-cvr-line bg-white px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

const addBtnCls =
  "rounded-lg border border-dashed border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink";

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
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">Tỷ lệ {ratio}</span>
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

// Card + Field đã gom về @/components/Ui. `note=` cũ → `desc=` của Panel
// (chữ to hơn một bậc, dễ đọc hơn, và giống mọi trang admin khác).

// ── Trình sửa 1 Landing page (info + số liệu + khối + thư viện ảnh) ──
function LandingEditor({ value: l, index, onChange, onDelete }: {
  value: Landing; index: number; onChange: (patch: Partial<Landing>) => void; onDelete: () => void;
}) {
  const setStat = (i: number, patch: Partial<Landing["stats"][number]>) =>
    onChange({ stats: l.stats.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setBlock = (i: number, patch: Partial<Landing["blocks"][number]>) =>
    onChange({ blocks: l.blocks.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const setGallery = (i: number, src: string) =>
    onChange({ gallery: l.gallery.map((x, j) => (j === i ? src : x)) });

  return (
    <div className="rounded-xl border border-cvr-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-cvr-ink">Landing {index + 1}{l.title ? ` — ${l.title}` : ""}</p>
        <button type="button" onClick={onDelete} className="text-xs font-medium text-red-600 hover:underline">Xoá landing</button>
      </div>

      <ImageField value={l.image} ratio="Ngang 2:1 · 2000×1000" onChange={(url) => onChange({ image: url })} />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Slug (đường dẫn)"><input value={l.slug} onChange={(e) => onChange({ slug: e.target.value })} placeholder="ve-coastal-land" className={inputCls} /></Field>
        <Field label="Eyebrow (nhãn nhỏ)"><input value={l.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} className={inputCls} /></Field>
        <Field label="Tiêu đề"><input value={l.title} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} /></Field>
        <Field label="Phụ đề"><input value={l.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} className={inputCls} /></Field>
        <Field label="Nhãn nút CTA"><input value={l.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} className={inputCls} /></Field>
        <Field label="Link nút CTA (href)"><input value={l.ctaHref} onChange={(e) => onChange({ ctaHref: e.target.value })} placeholder="/mua-ban" className={inputCls} /></Field>
      </div>
      <div className="mt-3"><Field label="Giới thiệu"><textarea value={l.intro} onChange={(e) => onChange({ intro: e.target.value })} rows={3} className={`${inputCls} h-auto py-2.5`} /></Field></div>

      {/* Số liệu */}
      <SubList title="Số liệu" onAdd={() => onChange({ stats: [...l.stats, { value: "", label: "" }] })} addLabel="+ Thêm số liệu">
        {l.stats.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input value={s.value} onChange={(e) => setStat(i, { value: e.target.value })} placeholder="2.500+" className={`${inputCls} flex-1`} />
            <input value={s.label} onChange={(e) => setStat(i, { label: e.target.value })} placeholder="Tin đã kiểm duyệt" className={`${inputCls} flex-[2]`} />
            <RemoveBtn onClick={() => onChange({ stats: l.stats.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </SubList>

      {/* Khối nội dung */}
      <SubList title="Khối nội dung" onAdd={() => onChange({ blocks: [...l.blocks, { title: "", desc: "" }] })} addLabel="+ Thêm khối">
        {l.blocks.map((b, i) => (
          <div key={i} className="flex gap-2">
            <input value={b.title} onChange={(e) => setBlock(i, { title: e.target.value })} placeholder="Tiêu đề" className={`${inputCls} flex-1`} />
            <input value={b.desc} onChange={(e) => setBlock(i, { desc: e.target.value })} placeholder="Mô tả" className={`${inputCls} flex-[2]`} />
            <RemoveBtn onClick={() => onChange({ blocks: l.blocks.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </SubList>

      {/* Thư viện ảnh */}
      <SubList title="Thư viện ảnh (4:3)" onAdd={() => onChange({ gallery: [...l.gallery, ""] })} addLabel="+ Thêm ảnh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {l.gallery.map((src, i) => (
            <div key={i}>
              <ImageField value={src} ratio="4:3 · 1200×900" onChange={(url) => setGallery(i, url)} />
              <button type="button" onClick={() => onChange({ gallery: l.gallery.filter((_, j) => j !== i) })} className="mt-1 text-xs font-medium text-red-600 hover:underline">Xoá ảnh</button>
            </div>
          ))}
        </div>
      </SubList>
    </div>
  );
}

// Khối con có tiêu đề + nút thêm dòng (dùng trong LandingEditor).
function SubList({ title, addLabel, onAdd, children }: { title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-cvr-body">{title}</p>
      <div className="space-y-2">{children}</div>
      <button type="button" onClick={onAdd} className={`mt-2 ${addBtnCls}`}>{addLabel}</button>
    </div>
  );
}

// Nút xoá 1 dòng (ô vuông ✕) — canh cao bằng input.
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Xoá dòng" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cvr-line text-cvr-muted transition hover:border-red-500 hover:text-red-600">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  );
}

// ── Trình sửa trang Giới thiệu công ty (/gioi-thieu) ──
function AboutEditor({ value: a, onChange }: { value: AboutData; onChange: (patch: Partial<AboutData>) => void }) {
  const setStory = (patch: Partial<AboutData["story"]>) => onChange({ story: { ...a.story, ...patch } });
  const setMarket = (patch: Partial<AboutData["market"]>) => onChange({ market: { ...a.market, ...patch } });
  const setCta = (patch: Partial<AboutData["cta"]>) => onChange({ cta: { ...a.cta, ...patch } });
  const setValue = (i: number, patch: Partial<AboutData["values"][number]>) =>
    onChange({ values: a.values.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  const setStat = (i: number, patch: Partial<AboutData["stats"][number]>) =>
    onChange({ stats: a.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-4">
      {/* Ảnh hero */}
      <div>
        <p className="mb-1.5 text-sm font-semibold text-cvr-ink">Ảnh đầu trang (hero)</p>
        <ImageField value={a.heroImage} ratio="Ngang · 1920×720" onChange={(url) => onChange({ heroImage: url })} />
      </div>

      {/* Câu chuyện */}
      <div className="rounded-xl border border-cvr-line p-4">
        <p className="mb-3 text-sm font-semibold text-cvr-ink">Câu chuyện — “Chúng tôi là ai”</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nhãn nhỏ (eyebrow)"><input value={a.story.eyebrow} onChange={(e) => setStory({ eyebrow: e.target.value })} className={inputCls} /></Field>
          <Field label="Tiêu đề"><input value={a.story.title} onChange={(e) => setStory({ title: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="mt-3"><ImageField value={a.story.image} ratio="16:10" onChange={(url) => setStory({ image: url })} /></div>
        <SubList title="Đoạn văn giới thiệu" addLabel="+ Thêm đoạn" onAdd={() => setStory({ paragraphs: [...a.story.paragraphs, ""] })}>
          {a.story.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <textarea value={p} onChange={(e) => setStory({ paragraphs: a.story.paragraphs.map((x, j) => (j === i ? e.target.value : x)) })} rows={2} className={`${inputCls} h-auto flex-1 py-2.5`} />
              <RemoveBtn onClick={() => setStory({ paragraphs: a.story.paragraphs.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </SubList>
      </div>

      {/* Tầm nhìn & Sứ mệnh */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tầm nhìn"><textarea value={a.vision} onChange={(e) => onChange({ vision: e.target.value })} rows={3} className={`${inputCls} h-auto py-2.5`} /></Field>
        <Field label="Sứ mệnh"><textarea value={a.mission} onChange={(e) => onChange({ mission: e.target.value })} rows={3} className={`${inputCls} h-auto py-2.5`} /></Field>
      </div>

      {/* Giá trị cốt lõi */}
      <div className="rounded-xl border border-cvr-line p-4">
        <SubList title="Giá trị cốt lõi (icon giữ theo thứ tự)" addLabel="+ Thêm giá trị" onAdd={() => onChange({ values: [...a.values, { title: "", desc: "" }] })}>
          {a.values.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input value={v.title} onChange={(e) => setValue(i, { title: e.target.value })} placeholder="Tiêu đề" className={`${inputCls} flex-1`} />
              <input value={v.desc} onChange={(e) => setValue(i, { desc: e.target.value })} placeholder="Mô tả" className={`${inputCls} flex-[2]`} />
              <RemoveBtn onClick={() => onChange({ values: a.values.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </SubList>
      </div>

      {/* Số liệu */}
      <div className="rounded-xl border border-cvr-line p-4">
        <p className="mb-1.5 text-sm font-semibold text-cvr-ink">Ảnh nền khối số liệu</p>
        <ImageField value={a.statsImage} ratio="Ngang · 1920×720" onChange={(url) => onChange({ statsImage: url })} />
        <SubList title="Số liệu (số · nhãn · dòng phụ)" addLabel="+ Thêm số liệu" onAdd={() => onChange({ stats: [...a.stats, { value: "", label: "", sub: "" }] })}>
          {a.stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.value} onChange={(e) => setStat(i, { value: e.target.value })} placeholder="24/7" className={`${inputCls} w-24`} />
              <input value={s.label} onChange={(e) => setStat(i, { label: e.target.value })} placeholder="Nhãn" className={`${inputCls} flex-1`} />
              <input value={s.sub} onChange={(e) => setStat(i, { sub: e.target.value })} placeholder="Dòng phụ" className={`${inputCls} flex-1`} />
              <RemoveBtn onClick={() => onChange({ stats: a.stats.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </SubList>
      </div>

      {/* Thị trường */}
      <div className="rounded-xl border border-cvr-line p-4">
        <p className="mb-3 text-sm font-semibold text-cvr-ink">Khối “Thị trường chuyên sâu”</p>
        <ImageField value={a.market.image} ratio="16:10" onChange={(url) => setMarket({ image: url })} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nhãn nhỏ"><input value={a.market.eyebrow} onChange={(e) => setMarket({ eyebrow: e.target.value })} className={inputCls} /></Field>
          <Field label="Tiêu đề"><input value={a.market.title} onChange={(e) => setMarket({ title: e.target.value })} className={inputCls} /></Field>
          <Field label="Nhãn nút CTA"><input value={a.market.ctaLabel} onChange={(e) => setMarket({ ctaLabel: e.target.value })} className={inputCls} /></Field>
          <Field label="Link nút CTA"><input value={a.market.ctaHref} onChange={(e) => setMarket({ ctaHref: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="mt-3"><Field label="Mô tả"><textarea value={a.market.desc} onChange={(e) => setMarket({ desc: e.target.value })} rows={3} className={`${inputCls} h-auto py-2.5`} /></Field></div>
      </div>

      {/* CTA cuối */}
      <div className="rounded-xl border border-cvr-line p-4">
        <p className="mb-3 text-sm font-semibold text-cvr-ink">Khối kêu gọi cuối trang (CTA)</p>
        <Field label="Tiêu đề"><input value={a.cta.title} onChange={(e) => setCta({ title: e.target.value })} className={inputCls} /></Field>
        <div className="mt-3"><Field label="Mô tả"><textarea value={a.cta.desc} onChange={(e) => setCta({ desc: e.target.value })} rows={2} className={`${inputCls} h-auto py-2.5`} /></Field></div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nút chính — nhãn"><input value={a.cta.primaryLabel} onChange={(e) => setCta({ primaryLabel: e.target.value })} className={inputCls} /></Field>
          <Field label="Nút chính — link"><input value={a.cta.primaryHref} onChange={(e) => setCta({ primaryHref: e.target.value })} className={inputCls} /></Field>
          <Field label="Nút phụ — nhãn"><input value={a.cta.secondaryLabel} onChange={(e) => setCta({ secondaryLabel: e.target.value })} className={inputCls} /></Field>
          <Field label="Nút phụ — link"><input value={a.cta.secondaryHref} onChange={(e) => setCta({ secondaryHref: e.target.value })} className={inputCls} /></Field>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project, Article } from "@/lib/data";
import type { DongTraCuu } from "@/lib/traCuuDuAn";
import ProjectsBrowser from "@/components/ProjectsBrowser";
import { smoothScrollTo } from "@/lib/scroll";
import { useAutoSlide, useAutoSlideThe, useTamDung } from "@/lib/useAutoSlide";
import AnhChay from "@/components/AnhChay";
import { anhNho } from "@/lib/asset";
import { sortProjectsByTier, ExpandToggle } from "@/components/ProjectSlider";
import { useHomeSection } from "@/components/HomeExpand";
import NhanTinhTrang, { capVip } from "@/components/NhanTinhTrang";
import { giaTriThat, loaiHinhThe } from "@/lib/truongDuAn";

const PER_SLIDE = 4; // 1 hàng × 4 dự án mỗi slide (số slide KHÔNG giới hạn)

// Dự án do trang cha truyền vào (đọc từ Supabase — admin đăng gì hiện nấy).
export default function ProjectsSection({ projects, articles = [] }: { projects: Project[]; articles?: Article[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  // Chạm thì dừng rồi TỰ CHẠY LẠI — màn cảm ứng không có động tác rê chuột ra,
  // để setPaused(true) trơ như cũ là chạm một cái slide chết tới khi tải lại trang.
  const { dung: paused, chamVao: chamDai, setDung: setPaused } = useTamDung(6000);
  const diMobRef = useRef<HTMLDivElement>(null);
  const { dung: pausedMob, chamVao: chamDaiMob } = useTamDung(6000);
  // Nút "Xem thêm" → khối này thành danh sách theo trang, các khối khác ẩn.
  const { expanded, hidden, toggle } = useHomeSection("du-an");
  // "Xem thêm" cùng logic trang Dự án (30/10/2026): sau dự án nổi bật là danh bạ Tra cứu — nạp lúc mở danh sách (không nhúng vào HTML)
  const [traCuu, setTraCuu] = useState<DongTraCuu[] | undefined>(undefined);
  useEffect(() => {
    if (!expanded || traCuu) return;
    fetch("/api/du-an/tra-cuu").then((r) => (r.ok ? r.json() : [])).then((ds: DongTraCuu[]) => setTraCuu(ds)).catch(() => setTraCuu([]));
  }, [expanded, traCuu]);

  // Homepage: slide 8 dự án đầu XẾP THEO CẤP VIP (Diamond → Gold → Silver → thường);
  // còn lại xem qua nút "Xem thêm".
  const ranked = sortProjectsByTier(projects);
  const homeProjects = ranked.slice(0, 8);
  const slides: typeof projects[] = [];
  for (let i = 0; i < homeProjects.length; i += PER_SLIDE) {
    slides.push(homeProjects.slice(i, i + PER_SLIDE));
  }
  const totalSlides = Math.max(slides.length, 1);
  const current = Math.min(slide, totalSlides - 1);

  const goTo = (i: number) => {
    const el = trackRef.current;
    const idx = (i + totalSlides) % totalSlides;
    if (el) smoothScrollTo(el, idx * el.clientWidth);
  };

  // Tự chạy: 7s/slide (4 thẻ dự án, ít chữ hơn tin BĐS) — chỉ khi section hiện
  // trong khung nhìn & không tương tác. Lệch nhịp 10s của "BĐS dành cho bạn"
  // để 2 slider không chuyển cùng lúc (đỡ rối mắt).
  useAutoSlide(trackRef, totalSlides, paused, 7000);
  useAutoSlideThe(diMobRef, homeProjects.length, pausedMob, 5000);

  if (projects.length === 0 || hidden) return null;

  return (
    <section className="section-edge bg-cvr-surface sm:bg-white">{/* Máy tính: nền trắng như mọi khối trang chủ (chủ dự án 24/10/2026: "đồng nhất cả nền") */}
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-7 lg:px-8">
        {/* Mở danh sách rồi thì ẩn tiêu đề khối — danh sách đã có tiêu đề riêng */}
        {!expanded && (
          <h2 className="text-xl font-semibold text-cvr-ink sm:text-2xl">
            Dự án nổi bật
          </h2>
        )}

        {/* Slide 8 dự án — ẩn đi khi bấm "Xem thêm" để nhường chỗ cho danh sách */}
        <div className={expanded ? "hidden" : undefined}>

        {/* ── MOBILE (< 640px): lướt ngang TỪNG thẻ dự án (như "BĐS dành cho bạn"),
            ló mép thẻ sau. ── */}
        {/* THẺ TRANG CHỦ ĐỒNG NHẤT (chủ dự án 31/10/2026): ảnh 16:9, chữ 13 px, MỖI THÔNG TIN MỘT DÒNG, dài thì cắt "…" → mọi thẻ cao bằng nhau */}
        <div className="sm:hidden">
          {/* Dải lướt ngang trên điện thoại: TỰ CHẠY từng thẻ; chạm là dừng hẳn. */}
          <div
            ref={diMobRef}
            onTouchStart={chamDaiMob}
            className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
          >
            {homeProjects.map((p) => (
              <Link key={p.slug} href={`/du-an/${p.slug}`} className="flex w-[90%] shrink-0 snap-start flex-col overflow-hidden rounded-none bg-white shadow-lux">
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <AnhChay images={[p.image, ...(p.photos ?? [])]} alt={p.name} sizes="90vw" chay={false} />
                  <NhanTinhTrang tier={p.tier} tinhTrang={giaTriThat(p.status)} />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 title={p.name} className="truncate font-semibold leading-[1.5] text-cvr-ink">{p.name}</h3>
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-[13px] text-cvr-muted">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{giaTriThat(p.location) || "Đang cập nhật"}</span>
                  </p>
                  {/* THẺ DỰ ÁN MỘT CHUẨN (chủ dự án 30–31/10/2026, như thẻ /du-an và Dự án tương tự): chỉ dòng Vị trí có biểu tượng; dòng khác nhãn đậm;

                      tiến độ: VIP ở nhãn trên ảnh, thẻ thường một dòng; dòng cuối Chủ đầu tư + giá; trống ghi "Đang cập nhật" */}

                  <p title={giaTriThat(p.type) || undefined} className="mt-1 truncate text-[13px] text-cvr-body"><span className="font-semibold text-cvr-ink">Loại hình:</span> <span className={giaTriThat(p.type) ? "" : "text-cvr-faint"}>{loaiHinhThe(p.type) || "Đang cập nhật"}</span></p>

                  {!capVip(p.tier) && <p className="mt-1 truncate text-[13px] text-cvr-body"><span className="font-semibold text-cvr-ink">Tiến độ:</span> <span className={giaTriThat(p.status) ? "" : "text-cvr-faint"}>{giaTriThat(p.status) || "Đang cập nhật"}</span></p>}

                  <span className="block h-3 shrink-0" aria-hidden />
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-cvr-line pt-3">
                    <span className="min-w-0 truncate text-[13px] text-cvr-body"><span className="font-semibold text-cvr-ink">Chủ đầu tư:</span> <span className={giaTriThat(p.developer) ? "" : "text-cvr-faint"}>{giaTriThat(p.developer) || "Đang cập nhật"}</span></span>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-cvr-ink">{p.priceFrom}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── TABLET/DESKTOP (≥ 640px): GIỮ NGUYÊN slider đã duyệt ── */}
        {/* Track scroll-snap: tự chạy + chấm/mũi tên + touchpad/mobile vuốt tự nhiên */}
        <div className="relative mt-4 hidden sm:mt-5 sm:block">
          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain"
            onScroll={(e) =>
              setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
            }
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={chamDai}
          >
            {slides.map((group, gi) => (
              <div key={gi} className="w-full shrink-0 snap-start">
                <div className="cards-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {group.map((p) => (
                    <Link
                      key={p.name}
                      href={`/du-an/${p.slug}`}
                      className="card-lux group relative flex flex-col overflow-hidden rounded-none border-0 bg-white shadow-lux hover:-translate-y-2 shadow-lux-hover"
                    >
                      <span className="card-sheen" aria-hidden />
                      <div className="relative aspect-[3/2] overflow-hidden sm:aspect-[4/3]">
                        <Image
                          // Thẻ dự án rộng ~25vw — dùng BẢN NHỎ. Bản gốc (có tấm 469 KB)
                          // vẫn được tải về mà không hiện ra, đo trên web thật 14/09/2026.
                          src={anhNho(p.image)}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                        />
                        {/* Nhãn tình trạng chung mọi nơi (NhanTinhTrang, 31/10/2026): chỉ VIP, màu theo cấp; dự án thường ghi sau loại hình */}
                        <NhanTinhTrang tier={p.tier} tinhTrang={giaTriThat(p.status)} />
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="font-semibold leading-snug text-cvr-ink">{p.name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-cvr-muted">
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {giaTriThat(p.location) || "Đang cập nhật"}
                        </p>
                        {/* THẺ DỰ ÁN MỘT CHUẨN (chủ dự án 30–31/10/2026, như thẻ /du-an và Dự án tương tự): chỉ dòng Vị trí có biểu tượng; dòng khác nhãn đậm;

                            tiến độ: VIP ở nhãn trên ảnh, thẻ thường một dòng; dòng cuối Chủ đầu tư + giá; trống ghi "Đang cập nhật" */}

                        <p title={giaTriThat(p.type) || undefined} className="mt-1 truncate text-xs text-cvr-body"><span className="font-semibold text-cvr-ink">Loại hình:</span> <span className={giaTriThat(p.type) ? "" : "text-cvr-faint"}>{loaiHinhThe(p.type) || "Đang cập nhật"}</span></p>

                        {!capVip(p.tier) && <p className="mt-1 text-xs text-cvr-body"><span className="font-semibold text-cvr-ink">Tiến độ:</span> <span className={giaTriThat(p.status) ? "" : "text-cvr-faint"}>{giaTriThat(p.status) || "Đang cập nhật"}</span></p>}

                        <span className="block h-3 shrink-0" aria-hidden />
                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-cvr-line pt-3">
                          <span className="min-w-0 text-xs text-cvr-body"><span className="font-semibold text-cvr-ink">Chủ đầu tư:</span> <span className={giaTriThat(p.developer) ? "" : "text-cvr-faint"}>{giaTriThat(p.developer) || "Đang cập nhật"}</span></span>
                          <span className="text-sm font-semibold text-cvr-ink">{p.priceFrom}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mũi tên chuyển slide — chỉ desktop (mobile/touchpad vuốt tay) */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                aria-label="Slide trước"
                onClick={() => goTo(current - 1)}
                className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                aria-label="Slide tiếp"
                onClick={() => goTo(current + 1)}
                className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cvr-line bg-white/90 text-cvr-ink shadow-lux backdrop-blur transition hover:bg-white sm:flex"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>

        {/* Hàng cuối: chấm chuyển slide (giữa) — "Xem tất cả" (phải). Mobile ẩn (đã có nút Xem thêm). */}
        <div className="relative mt-4 hidden items-center justify-center sm:flex">
          {totalSlides > 1 && (
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-cvr-ink" : "w-2 bg-cvr-line hover:bg-cvr-muted"}`}
                />
              ))}
            </div>
          )}
        </div>

        </div>{/* hết khối slide */}

        {/* Bấm "Xem thêm" → danh sách Dự án nổi bật CÙNG LOGIC trang Dự án (thẻ Tên · Địa chỉ · Loại hình · Chủ đầu tư, 10 dự án/trang) — 30/10/2026 */}
        {/* Mở ra: cách khối sau đúng 56px như mọi khối trang chủ máy tính (24/10/2026) */}
        {/* Danh sách mở ra có cả dự án tra cứu → không gọi "Dự án nổi bật" (chủ dự án 31/10/2026); dùng đúng tên trang Dự án */}
        {expanded && <div className="sm:pb-4"><ProjectsBrowser projects={ranked} articles={articles} danhSachNoiBat traCuu={traCuu} tieuDeDs="Dự án bất động sản" /></div>}

        {ranked.length > 0 && (
          <div className="sm:-mt-4"><ExpandToggle expanded={expanded} onClick={toggle} /></div>
        )}
      </div>
    </section>
  );
}

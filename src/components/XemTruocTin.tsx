"use client";

import { useEffect } from "react";
import AvatarMacDinh, { tenKhongCoChu } from "@/components/AvatarMacDinh";
import { useNutQuayLai } from "@/lib/khoaCuon";
import Gallery from "@/components/Gallery";
import { ANH_MAC_DINH } from "@/lib/anhMau";
import RichContent from "@/components/RichContent";
import { getTier, type TierId } from "@/lib/packages";
import { nhanDienTich as nhanDienTichTheoLoai, laTinThue } from "@/lib/listingSpec";
import type { ListingFull } from "@/lib/listingsDb";

// ============================================================================
// XEM TRƯỚC TIN ĐĂNG (chủ dự án 15/10/2026: "phải cấu trúc để khách hình dung được tin đăng như thế
// nào trước khi bấm đăng"). Bố cục chép đúng phần đầu trang tin /bat-dong-san/[id] — ảnh, hạng tin,
// tiêu đề, địa chỉ hai hệ, khối giá · diện tích · thông tin chính, mô tả, đặc điểm, nội thất, tiện
// ích, liên hệ. Dữ liệu dựng bằng chính hàm của trang tin (xemTruocTin) nên xem sao đăng vậy.
// Đổi bố cục trang tin thì sửa cả ở đây.
// ============================================================================

export default function XemTruocTin({
  du,
  tier,
  onDong,
  onDang,
  dangLuu,
  chuaCoAnh,
}: {
  du: ListingFull;
  tier: TierId | "";
  onDong: () => void;
  onDang: () => void;
  dangLuu: boolean;
  /** Khách chưa up ảnh nào → hiện ảnh mẫu đẹp nhất hợp loại hình, ghi "Ảnh mẫu" (chủ dự án 23/10/2026). */
  chuaCoAnh?: boolean;
}) {
  useNutQuayLai(true, onDong); // nút Quay lại điện thoại đóng lớp này, không rời trang (hàm chung, 22/10/2026)
  const l = du.listing;
  const d = du;
  const hang = getTier((tier || "basic") as TierId);
  const tieuDe1Dong = l.title.replace(/\s+/g, " ").trim();
  const nhanGia = laTinThue(l.purpose) ? "Giá thuê" : "Mức giá";
  const nhanDienTich = nhanDienTichTheoLoai(l.type).replace(" (m²)", "");
  const duoi = l.locationCu && l.locationCu !== l.location ? l.locationCu : "";
  const coTienIch = d.amenityGroups.some((g) => g.items.some((it) => it.active));

  // Khoá cuộn trang phía sau; phím Esc = quay lại sửa
  useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (e: KeyboardEvent) => e.key === "Escape" && onDong();
    window.addEventListener("keydown", phim);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", phim);
    };
  }, [onDong]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Xem trước tin đăng">
      <div className="flex shrink-0 items-center gap-2 border-b border-cvr-line px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-4">
        <button type="button" aria-label="Quay lại sửa" onClick={onDong} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-ink transition hover:bg-cvr-surface">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="min-w-0 flex-1 truncate text-[16px] font-semibold text-cvr-ink">Xem trước tin đăng</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <div className="-mx-4 mb-5 sm:mx-0 sm:mt-4">
            {/* Khách chưa up ảnh → ảnh mặc định Coastal Land, ghi rõ "Ảnh mẫu" (chủ dự án 23/10/2026: "ghi (ảnh mẫu)" · "chưa có ảnh
                là lấy ảnh Coastal Land mặc định") — chỉ để xem trước, không lưu vào tin (src/lib/anhMau.ts). */}
            <div className="relative">
              <Gallery images={chuaCoAnh ? [ANH_MAC_DINH] : d.images} videos={d.videos} alt={tieuDe1Dong} />
              {chuaCoAnh && (
                <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white">Ảnh mẫu</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tier && tier !== "basic" ? (
              <span className="inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: hang.accent }}>
                {hang.name}
              </span>
            ) : (
              <span className="inline-block rounded bg-cvr-surface px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cvr-muted ring-1 ring-cvr-line">
                {getTier("basic").name}
              </span>
            )}
          </div>

          <h1 className="mt-3 whitespace-pre-line break-words text-[21px] font-semibold leading-[1.3] tracking-tight text-cvr-ink sm:text-[28px]">{l.title}</h1>

          <p className="mt-2 flex items-start gap-1.5 text-[14px] leading-relaxed text-cvr-muted sm:text-[15px]">
            <svg className="mt-[2px] h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="min-w-0">{d.addressDetail ? d.addressDetail + ", " : ""}{l.location}</span>
          </p>
          {duoi && <p className="mt-1 pl-[22px] text-[13px] text-cvr-faint">Địa chỉ cũ: {duoi}</p>}

          <div className="mt-5 rounded-2xl border border-cvr-line bg-white p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <div className="min-w-0">
                <p className="text-[12px] text-cvr-muted">{nhanGia}</p>
                <p className="mt-1 break-words text-[20px] font-bold leading-tight text-red-500 sm:text-[22px]">{l.price}</p>
              </div>
              {d.tienDau.map((f) => (
                <div key={f.label} className="min-w-0">
                  <p className="text-[12px] text-cvr-muted">{f.label}</p>
                  <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{f.value}</p>
                </div>
              ))}
              <div className="min-w-0">
                <p className="text-[12px] text-cvr-muted">{nhanDienTich}</p>
                <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{l.area}</p>
              </div>
              {d.builtArea && (
                <div className="min-w-0">
                  <p className="text-[12px] text-cvr-muted">Diện tích sử dụng</p>
                  <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{d.builtArea}</p>
                </div>
              )}
              {l.pricePerM2 && (
                <div className="min-w-0">
                  <p className="text-[12px] text-cvr-muted">Giá / m²</p>
                  <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{l.pricePerM2}</p>
                </div>
              )}
              {d.tienSau.map((f) => (
                <div key={f.label} className="min-w-0">
                  <p className="text-[12px] text-cvr-muted">{f.label}</p>
                  <p className="mt-1 break-words text-[17px] font-semibold leading-tight text-cvr-ink">{f.value}</p>
                </div>
              ))}
            </div>
            {(l.beds || l.baths || d.direction || d.furnish || d.specsChinh.length > 0) && (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-cvr-line pt-4 sm:grid-cols-4">
                {l.beds ? <MiniStat label="Phòng ngủ" value={l.beds + " PN"} /> : null}
                {l.baths ? <MiniStat label="Phòng tắm" value={l.baths + " WC"} /> : null}
                {d.specsChinh.map((f) => <MiniStat key={f.label} label={f.label} value={f.value} />)}
                {d.direction && <MiniStat label="Hướng" value={d.direction} />}
                {d.furnish && <MiniStat label="Nội thất" value={d.furnish} />}
              </div>
            )}
          </div>

          {d.descriptionParas.length > 0 && (
            <Section title="Thông tin mô tả">
              <div className="space-y-3 text-[15px] leading-relaxed text-cvr-body">
                <RichContent paragraphs={d.descriptionParas} title={tieuDe1Dong} wysiwyg />
              </div>
            </Section>
          )}

          <Section title="Đặc điểm bất động sản">
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <Row label="Loại hình" value={l.type} />
              {d.projectName && <Row label="Dự án" value={d.projectName} />}
              {d.specs.map((f) => <Row key={f.label} label={f.label} value={f.value} />)}
              <Row label="Tình trạng pháp lý" value={d.legal ?? "Chưa cập nhật"} />
            </div>
          </Section>

          {d.interior.length > 0 && (
            <Section title="Nội thất bàn giao">
              <DanhSachTick items={d.interior} />
            </Section>
          )}

          {coTienIch && (
            <Section title="Tiện ích">
              <div className="space-y-5">
                {d.amenityGroups.map((g) => {
                  const bat = g.items.filter((it) => it.active).map((it) => it.name);
                  if (!bat.length) return null;
                  return (
                    <div key={g.group}>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-cvr-faint">{g.group}</p>
                      <DanhSachTick items={bat} />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {d.contact && (
            <Section title="Liên hệ">
              <div className="flex items-center gap-3 rounded-2xl border border-cvr-line p-4">
                {d.contact.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.contact.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cvr-surface text-lg font-semibold text-cvr-ink">
                    {tenKhongCoChu(d.contact.name) ? <AvatarMacDinh /> : (d.contact.name || "?").trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="break-words font-semibold text-cvr-ink">{d.contact.name}</p>
                  <p className="mt-0.5 text-[15px] text-cvr-body">{d.contact.phone}</p>
                  {d.contact.email && <p className="mt-0.5 break-all text-[14px] text-cvr-muted">{d.contact.email}</p>}
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-cvr-line bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:justify-end sm:px-6">
        <button type="button" onClick={onDong} className="flex h-12 flex-1 items-center justify-center rounded-full bg-cvr-surface px-6 text-base font-semibold text-cvr-body ring-1 ring-inset ring-cvr-line transition hover:bg-cvr-line/40 sm:flex-none">
          Sửa tiếp
        </button>
        <button type="button" onClick={onDang} disabled={dangLuu} className="btn-dangtin flex h-12 flex-1 items-center justify-center rounded-full px-8 text-base font-bold text-white disabled:opacity-50 sm:flex-none">
          {dangLuu ? "Đang gửi duyệt…" : "Đăng tin ngay"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-[19px] font-semibold tracking-tight text-cvr-ink sm:text-[22px]">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cvr-line py-3 text-[15px]">
      <span className="shrink-0 whitespace-nowrap text-cvr-muted">{label}</span>
      <span className="min-w-0 whitespace-pre-line break-words text-right font-medium text-cvr-ink">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] leading-tight text-cvr-muted">{label}</p>
      <p className="mt-1 whitespace-pre-line break-words text-[15px] font-semibold leading-snug text-cvr-ink">{value}</p>
    </div>
  );
}

function DanhSachTick({ items }: { items: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((a) => (
        <span key={a} className="flex items-center gap-2 rounded-lg border border-cvr-line bg-white px-3 py-2.5 text-[13px] text-cvr-body">
          <svg className="h-4 w-4 shrink-0 text-cvr-gold-ink" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {a}
        </span>
      ))}
    </div>
  );
}

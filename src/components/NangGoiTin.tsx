"use client";

import { useEffect, useMemo, useState } from "react";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import { bangNangGoi, bangTheoMucDich, chuNangGoi, giaNangGoi, vnd, type BillingData, type Plan } from "@/lib/billing";
import { goiHienTai, hangDangChay, oNangDuoc, soNgayCon } from "@/lib/nangGoi";
import { getTier, type TierId } from "@/lib/packages";
import { THUE_SUAT_GTGT, tachThue } from "@/lib/thue";
import { createClient } from "@/lib/supabase/client";
import { useQuyDinhGia } from "@/lib/useQuyDinhGia";
import type { ListingRow } from "@/lib/listingAdmin";

// ============================================================================
// NÂNG GÓI — PHÍA KHÁCH (chủ dự án chốt 01/11/2026)
// Cùng bảng giá gói với đăng tin (BangGiaGoiTin): gói đang chạy + gói thấp hơn mờ, không chọn; gói cao hơn hiện SỐ KHÁCH TRẢ
// cuối cùng (giaNangGoi: giá nâng đã công bố → khấu trừ nếu khách chọn → ưu đãi hội viên → VAT). Khối Tổng tiền như đăng tin,
// thêm ô khách chọn khấu trừ. Đủ ví → gửi yêu cầu (tạm giữ, tin vẫn hiện gói cũ, admin duyệt mới trừ); thiếu → Nạp thêm.
// Mọi chữ phía khách lấy từ Admin (chuNangGoi — chưa Duyệt thì chữ mẫu, chỉ máy xem thử thấy nút).
// ============================================================================
const ve = (id: string, tier?: TierId | "", days?: number) =>
  `/tai-khoan/tin-dang?nang=${id}${tier ? `&tier=${tier}&days=${days}` : ""}`;

export default function NangGoiTin({ r, billing, demoVi, chonDau, onDong, onDaGui }: {
  r: ListingRow;
  billing: BillingData;
  /** Bản demo /demo/tin-cua-toi: ví mẫu, không đọc ví / voucher, gửi không ghi gì */
  demoVi?: ViKhach;
  chonDau?: { tier: TierId; days: number } | null;
  onDong: () => void;
  onDaGui: (details: Record<string, unknown>) => void;
}) {
  const chu = chuNangGoi(billing);
  const tin = r as Parameters<typeof goiHienTai>[0];
  const hang = hangDangChay(tin);
  const goiCu = goiHienTai(tin);
  const [chon, setChon] = useState<{ tier: TierId | ""; days: number }>(chonDau ?? { tier: "", days: 0 });
  const [apKhauTru, setApKhauTru] = useState(true);
  const vi = useViKhaDung(demoVi);
  const [hoiVien, setHoiVien] = useState<string | null>(null);
  const [voucherGiam, setVoucherGiam] = useState(0);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    if (demoVi) return;
    // Voucher hội viên "tin-vip" còn lượt, trong kỳ — dự kiến trừ lúc duyệt (máy chủ dùng thật bằng dung_voucher, như form đăng tin)
    createClient().from("hoi_vien_voucher").select("giam,con_lai,tu,den").eq("loai", "tin-vip").gt("con_lai", 0)
      .then(({ data }) => {
        const bay = Date.now();
        const v = ((data ?? []) as { giam: number; tu: string; den: string }[])
          .filter((x) => Date.parse(x.tu) <= bay && Date.parse(x.den) > bay)
          .sort((a, b) => Date.parse(a.den) - Date.parse(b.den) || Number(b.giam) - Number(a.giam))[0];
        setVoucherGiam(v ? Number(v.giam) : 0);
      });
    createClient().from("hoi_vien").select("goi").gt("het_han", new Date().toISOString()).limit(1)
      .then(({ data }) => setHoiVien((data?.[0]?.goi as string | undefined) ?? null));
  }, []);

  // Bảng hiện: cấp nâng được lấy bảng giá nâng đã công bố (chưa công bố → bảng gói tin, như giaNangGoi); cấp khoá giữ bảng gói tin.
  const plans: Plan[] = useMemo(() => {
    const goc = bangTheoMucDich(billing, r.purpose).plans;
    const nang = bangNangGoi(billing, r.purpose); // giá Nâng gói ĐÃ DUYỆT trong Admin (06/11/2026 — trước đòi thêm ô "Bật", hiện nhầm giá gói thường)
    return goc.map((p) => nang.find((n) => n.tierId === p.tierId) ?? p);
  }, [billing, r.purpose]);
  // UP TIN = CHỌN LẠI GÓI (06/11/2026): ô nào giá cao hơn gói đang chạy thì chọn được (oNangDuoc); còn lại mờ.
  const duocChon = (t: TierId, d: number) => oNangDuoc(r as Parameters<typeof oNangDuoc>[0], billing, t, d);
  const tinh = (tier: TierId, days: number, ap = apKhauTru, voucher = 0) =>
    giaNangGoi({ data: billing, purpose: r.purpose, tierMoi: tier, soNgay: days, goiHienTai: goiCu, hoiVienId: hoiVien, apKhauTru: ap, voucher });
  const truocVoucher = chon.tier ? tinh(chon.tier, chon.days) : null; // số tạm giữ lúc gửi
  const gia = chon.tier ? tinh(chon.tier, chon.days, apKhauTru, billing.hoiVien?.length ? voucherGiam : 0) : null;
  const khauTruCo = chon.tier ? (tinh(chon.tier, chon.days, true)?.khauTru ?? 0) : 0;
  const thue = gia ? tachThue(gia.truocThue) : null;
  const thieu = truocVoucher && vi ? Math.max(0, truocVoucher.tongTra - vi.khaDung) : 0;

  async function gui() {
    if (!chon.tier || !gia) return;
    if (demoVi) {
      window.alert("Bản demo — không ghi gì, không trừ tiền.");
      return onDaGui({ ...(r.details ?? {}), nang_cho: { tier: chon.tier, days: chon.days, apKhauTru, khauTru: gia.khauTru, truocThue: gia.truocThue, tongTra: gia.tongTra, gui_luc: new Date().toISOString() } });
    }
    setDang(true); setLoi("");
    const res = await fetch("/api/tin-dang/nang-goi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, tier: chon.tier, days: chon.days, apKhauTru }),
    });
    const j = await res.json().catch(() => ({ ok: false, loi: "Máy chủ không trả lời." }));
    setDang(false);
    if (!j.ok) return setLoi(j.loi ?? "Chưa gửi được.");
    onDaGui({ ...(r.details ?? {}), nang_cho: j.yeuCau });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:pt-[8vh]" onClick={() => !dang && onDong()}>
      <div className="h-[85dvh] max-h-[85dvh] w-full max-w-2xl overflow-y-auto overscroll-contain sm:h-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-cvr-muted">{chu.nutNang}</p>
          <NutDong onClick={() => !dang && onDong()} />
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-cvr-ink">{r.title || "(chưa có tiêu đề)"}</h3>
        <p className="mt-2 text-[13px] text-cvr-body">
          {chu.goiDangChay.replace("{goi}", getTier(hang).name).replace("{ngay}", String(soNgayCon(tin)))}
        </p>
        <DongSoDu vi={vi} can={truocVoucher?.tongTra ?? 0} />
        {/* BẢNG GIÁ KIỂU MA TRẬN như trang Báo giá (chủ dự án 01/11/2026: "bấm Up tin bố trí ra danh sách gói kiểu ma trận, ra bảng giá
            thì cấu trúc khách đang ở gói nào"): cột gói đang chạy ghi "Gói đang chạy"; gói đang chạy + thấp hơn mờ, không chọn; gói cao
            hơn hiện số khách trả cuối cùng. Chọn xong mới hiện Tổng tiền. */}
        <div className="mt-4">
          <BangGiaGoiTin
            plans={plans}
            khoaO={(t, d) => !duocChon(t, d)}
            capDangChay={hang}
            giaKhach={(t, d) => (duocChon(t, d) ?(tinh(t, d)?.tongTra ?? null) : null)}
            chon={chon}
            onChon={(t, d) => setChon({ tier: t, days: d })}
            onBoChon={() => setChon({ tier: "", days: 0 })}
            kieuBaoGia
          />
        </div>
        <LienKetQuyDinh chu={chu.lienKetQuyDinh} className="mt-2" />

        {gia && thue && (
          <KhoiTongTien
            moTa={`${getTier(chon.tier as TierId).name} · ${chon.days} ngày · Ngay khi được duyệt`}
            tongTra={gia.tongTra}
            canGiu={truocVoucher?.tongTra}
            vi={vi}
            dong={[
              { nhan: "Phí gói", giaTri: vnd(gia.giaGoi) },
              ...(gia.khauTru > 0 ? [{ nhan: "Khấu trừ gói đang chạy", giaTri: `− ${vnd(gia.khauTru)}`, nhan2: true }] : []),
              ...(gia.uuDaiHoiVien > 0 ? [{ nhan: "Ưu đãi hội viên", giaTri: `− ${vnd(gia.uuDaiHoiVien)}`, nhan2: true }] : []),
              ...(gia.voucher > 0 ? [{ nhan: "Voucher hội viên", giaTri: `− ${vnd(gia.voucher)}`, nhan2: true }] : []),
              ...(thue.tienHang !== gia.giaGoi ? [{ nhan: "Tạm tính", giaTri: vnd(thue.tienHang) }] : []),
              { nhan: `VAT ${(THUE_SUAT_GTGT * 100).toFixed(0)}%`, giaTri: vnd(thue.tienThue) },
            ]}
          >
            {khauTruCo > 0 && (
              <label className="mt-3 flex items-start gap-2.5 text-[13.5px] text-cvr-ink">
                <input type="checkbox" checked={apKhauTru} onChange={(e) => setApKhauTru(e.target.checked)} className="mt-0.5 h-4 w-4 accent-cvr-ink" />
                <span>{chu.oKhauTru.replace("{tien}", vnd(khauTruCo))}</span>
              </label>
            )}
          </KhoiTongTien>
        )}
        {loi && <p className="mt-3 text-sm text-red-600">{loi}</p>}

        {/* MỘT NÚT (chủ dự án 06/11/2026): ví đủ → Up tin · ví thiếu → Nạp thêm */}
        <NutThanhToan
          ten={chu.nutNang}
          chuaChon={!gia}
          thieu={thieu}
          napHref={`/tai-khoan/nap-tien?can=${thieu}&ve=${encodeURIComponent(ve(r.id, chon.tier, chon.days))}`}
          dang={dang}
          onClick={gui}
        />
      </div>
    </div>
  );
}

// Nút cuối bảng Up tin · Đẩy tin: chưa chọn gói → mờ · ví đủ → Up tin / Đẩy tin · ví thiếu → Nạp thêm (số còn thiếu)
export function NutThanhToan({ ten, chuaChon, thieu, napHref, dang, onClick }: {
  ten: string; chuaChon: boolean; thieu: number; napHref: string; dang?: boolean; onClick: () => void;
}) {
  const lop = "bg-cvr-blue hover:bg-cvr-blue/90 transition flex h-12 w-full items-center justify-center rounded-lg text-[15px] font-semibold text-white disabled:opacity-50";
  return (
    <div className="mt-5">
      {!chuaChon && thieu > 0 ? (
        <a href={napHref} className={lop}>Nạp thêm {vnd(thieu)}</a>
      ) : (
        <button type="button" onClick={onClick} disabled={chuaChon || dang} className={lop}>
          {dang ? "Đang gửi…" : chuaChon ? "Chọn gói" : ten}
        </button>
      )}
    </div>
  );
}

// Nút X đóng bảng (góc trên phải) — Up tin · Đẩy tin
export function NutDong({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Đóng"
      className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cvr-muted transition hover:bg-cvr-surface hover:text-cvr-ink">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  );
}

// ── Phần dùng chung Nâng gói · Đẩy tin (cùng mẫu khối Tổng tiền của form đăng tin) ──
export type ViKhach = { khaDung: number; tamGiu: number } | null;

/** Ví của chính khách: khả dụng = số dư − tạm giữ (so_du_kha_dung, 0056/0067). */
export function useViKhaDung(mau?: ViKhach): ViKhach {
  const [vi, setVi] = useState<ViKhach>(mau ?? null);
  useEffect(() => {
    if (mau) return; // bản demo: ví mẫu
    createClient().rpc("so_du_kha_dung").then(({ data }) => {
      const d = (data as { kha_dung: number; tam_giu: number }[] | null)?.[0];
      if (d) setVi({ khaDung: Number(d.kha_dung), tamGiu: Number(d.tam_giu) });
    });
  }, []);
  return vi;
}

export function KhoiTongTien({ moTa, tongTra, canGiu, dong, vi, children }: {
  moTa: string;
  tongTra: number;
  /** Số ví phải đủ lúc gửi (tạm giữ = giá trước voucher, như form đăng tin); mặc định = tongTra */
  canGiu?: number;
  dong: { nhan: string; giaTri: string; nhan2?: boolean }[];
  vi: ViKhach;
  children?: React.ReactNode;
}) {
  const [chiTiet, setChiTiet] = useState(false);
  void canGiu; void vi; // số dư nay hiện ở đầu bảng (DongSoDu)
  return (
    <div className="mt-4 rounded-2xl border border-cvr-line bg-cvr-surface px-4 py-3.5 text-sm text-cvr-body">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-cvr-ink">Tổng tiền</span>
          <span className="mt-0.5 block text-[12.5px] text-cvr-muted">{moTa}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-xl font-bold tabular-nums tracking-tight text-cvr-ink">{tongTra > 0 ? vnd(tongTra) : "0 ₫"}</span>
          <button type="button" onClick={() => setChiTiet(!chiTiet)} aria-expanded={chiTiet} className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-cvr-blue-ink">
            Chi tiết
            <svg className={`h-3.5 w-3.5 transition ${chiTiet ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </span>
      </div>
      {children}
      {chiTiet && (
        <div className="mt-3 border-t border-cvr-line pt-2">
          {dong.map((d) => (
            <div key={d.nhan} className={`flex items-baseline justify-between gap-3 py-1 ${d.nhan2 ? "text-cvr-blue-ink" : ""}`}>
              <span>{d.nhan}</span>
              <span className={`text-right font-semibold tabular-nums ${d.nhan2 ? "" : "text-cvr-ink"}`}>{d.giaTri}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// SỐ DƯ VÍ HIỆN NGAY ĐẦU BẢNG (chủ dự án 06/11/2026: "số dư ví là cái hiện luôn ra trước mặt") — đỏ khi không đủ gói đang chọn
export function DongSoDu({ vi, can }: { vi: ViKhach; can: number }) {
  if (!vi) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-cvr-surface px-3.5 py-2.5 text-sm">
      <span className="text-cvr-muted">
        {vi.tamGiu > 0 ? "Số dư khả dụng" : "Số dư ví"}
        {vi.tamGiu > 0 && <span className="block text-xs text-cvr-faint">Đang tạm giữ {vnd(vi.tamGiu)}</span>}
      </span>
      <span className={`font-semibold tabular-nums ${can > vi.khaDung ? "text-red-600" : "text-cvr-ink"}`}>{vnd(vi.khaDung)}</span>
    </div>
  );
}

/** Dòng liên kết quy định (chữ từ Admin, mỗi phần cách " · "): Quy định gói tin · Up tin · Đẩy tin — CÙNG KIỂU BẢN ĐANG CHẠY TRÊN WEB
 *  (chủ dự án 01/11/2026: "làm cùng kiểu với bản trên web"): như chữ "Quy định" ở trang Báo giá, dẫn tới trang /quy-dinh mục 5
 *  (Gói đăng tin · Gói Up tin · Gói đẩy tin). Mở tab mới để khách không mất form / bảng đang chọn. Phần chưa duyệt thì không hiện. */
const DICH_QUY_DINH = ["/quy-dinh#quy-dinh-goi-tin", "/quy-dinh#quy-dinh-up-tin", "/quy-dinh#quy-dinh-day-tin"];
export function LienKetQuyDinh({ chu, className = "" }: { chu: string; className?: string }) {
  const qd = useQuyDinhGia();
  const noiDung = [qd.quyDinhGoiTin, qd.quyDinhUpTin ?? [], qd.quyDinhDayTin];
  const phan = chu.split(" · ").filter(Boolean).map((ten, i) => ({ ten, i })).filter((x) => (noiDung[x.i] ?? []).length > 0);
  if (!phan.length) return null;
  return (
    <p className={`text-[12.5px] text-cvr-muted ${className}`}>
      {phan.map((x, k) => (
        <span key={x.ten}>
          {k > 0 && " · "}
          <a href={DICH_QUY_DINH[x.i]} target="_blank" rel="noopener" className="font-semibold text-cvr-blue-ink hover:underline">{x.ten}</a>
        </span>
      ))}
    </p>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import BangGiaGoiTin from "@/components/BangGiaGoiTin";
import { bangNangGoi, bangTheoMucDich, chuNangGoi, giaNangGoi, vnd, type BillingData, type Plan } from "@/lib/billing";
import { goiHienTai, goiNangDuoc, hangDangChay, soNgayCon, THU_HANG } from "@/lib/nangGoi";
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
    const nang = billing.nangGoi?.bat ? bangNangGoi(billing, r.purpose) : [];
    return goc.map((p) => nang.find((n) => n.tierId === p.tierId) ?? p);
  }, [billing, r.purpose]);
  const nangDuoc = goiNangDuoc(tin);
  const khoaCap = (["basic", "silver", "gold", "diamond"] as TierId[]).filter((t) => THU_HANG[t] <= THU_HANG[hang]);
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !dang && onDong()}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-cvr-muted">{chu.nutNang}</p>
        <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-cvr-ink">{r.title || "(chưa có tiêu đề)"}</h3>
        <p className="mt-2 text-[13px] text-cvr-body">
          {chu.goiDangChay.replace("{goi}", getTier(hang).name).replace("{ngay}", String(soNgayCon(tin)))}
        </p>
        {/* BẢNG GIÁ KIỂU MA TRẬN như trang Báo giá (chủ dự án 01/11/2026: "bấm Up tin bố trí ra danh sách gói kiểu ma trận, ra bảng giá
            thì cấu trúc khách đang ở gói nào"): cột gói đang chạy ghi "Gói đang chạy"; gói đang chạy + thấp hơn mờ, không chọn; gói cao
            hơn hiện số khách trả cuối cùng. Chọn xong mới hiện Tổng tiền. */}
        <div className="mt-4">
          <BangGiaGoiTin
            plans={plans}
            khoaCap={khoaCap}
            capDangChay={hang}
            giaKhach={(t, d) => (nangDuoc.includes(t) ? (tinh(t, d)?.tongTra ?? null) : null)}
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
            napHref={`/tai-khoan/nap-tien?can=${thieu}&ve=${encodeURIComponent(ve(r.id, chon.tier, chon.days))}`}
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

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onDong} disabled={dang} className="h-11 flex-1 rounded-lg border border-cvr-line bg-white text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink">Huỷ</button>
          <button type="button" onClick={gui} disabled={!gia || thieu > 0 || dang}
            className="btn-dangtin h-11 flex-[2] rounded-lg text-sm font-semibold text-white disabled:opacity-50">
            {dang ? "Đang gửi…" : gia ? `${chu.nutNang} — ${vnd(gia.tongTra)}` : "Chọn gói và thời hạn"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Danh sách gói (Up tin · Đẩy tin): mỗi gói một dòng, bấm dòng là chọn, bấm lại là bỏ ──
export type MucGoi = { khoa: string; ten: React.ReactNode; phu: string; gia: number; mo?: boolean; dangChon: boolean; onChon: () => void };
export function DanhSachGoi({ muc }: { muc: MucGoi[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {muc.map((m) => (
        <li key={m.khoa}>
          <button
            type="button"
            disabled={m.mo}
            aria-pressed={m.dangChon}
            onClick={m.onChon}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
              m.dangChon ? "border-cvr-ink bg-cvr-surface ring-1 ring-cvr-ink" : "border-cvr-line bg-white hover:border-cvr-ink/40"
            }`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              {m.ten}
              <span className="whitespace-nowrap text-[14px] text-cvr-body">{m.phu}</span>
            </span>
            <span className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-cvr-ink">{m.gia > 0 ? vnd(m.gia) : "0 ₫"}</span>
            {!m.mo && (
              <span className={`inline-flex h-7 shrink-0 items-center rounded-md px-3 text-[12px] font-semibold ${m.dangChon ? "border border-cvr-ink bg-white text-cvr-ink" : "bg-cvr-blue text-white"}`}>
                {m.dangChon ? "Bỏ chọn" : "Chọn"}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
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

export function KhoiTongTien({ moTa, tongTra, canGiu, dong, vi, napHref, children }: {
  moTa: string;
  tongTra: number;
  /** Số ví phải đủ lúc gửi (tạm giữ = giá trước voucher, như form đăng tin); mặc định = tongTra */
  canGiu?: number;
  dong: { nhan: string; giaTri: string; nhan2?: boolean }[];
  vi: ViKhach;
  napHref: string;
  children?: React.ReactNode;
}) {
  const [chiTiet, setChiTiet] = useState(false);
  const thieu = vi ? Math.max(0, (canGiu ?? tongTra) - vi.khaDung) : 0;
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
      {vi && tongTra > 0 && (
        <div className="mt-3 rounded-xl bg-white px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-cvr-muted">
              {vi.tamGiu > 0 ? "Số dư khả dụng" : "Số dư ví"}
              {vi.tamGiu > 0 && <span className="block text-xs text-cvr-faint">Đang tạm giữ {vnd(vi.tamGiu)}</span>}
            </span>
            <span className={thieu > 0 ? "font-semibold tabular-nums text-red-600" : "font-semibold tabular-nums text-cvr-ink"}>{vnd(vi.khaDung)}</span>
          </div>
          {thieu > 0 && (
            <a href={napHref} className="mt-2.5 flex h-12 w-full items-center justify-center rounded-lg bg-cvr-ink text-[15px] font-bold text-white transition hover:bg-cvr-ink/90">
              Nạp thêm {vnd(thieu)}
            </a>
          )}
        </div>
      )}
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

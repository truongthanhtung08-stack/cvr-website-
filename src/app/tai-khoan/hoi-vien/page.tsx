"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useBilling } from "@/lib/useBilling";
import { useProfile } from "@/lib/useProfile";
import { giaTra, vnd, TEN_VOUCHER, type LoaiVoucher } from "@/lib/billing";
import { tachThue } from "@/lib/thue";
import { PageHeader } from "@/components/Ui";
import GoiHoiVienCards, { DieuKienHoiVien } from "@/components/GoiHoiVienCards";
import { ghepQuyDinh, KHOA_QUY_DINH_GIA, type QuyDinhGia } from "@/lib/quyDinhGia";

// ============================================================================
// GÓI HỘI VIÊN CỦA TÔI (chủ dự án chốt 25/09/2026 — cơ chế theo Batdongsan)
//   · Đang có gói → tên gói, hạn, voucher CÒN LẠI của kỳ 30 ngày hiện tại.
//   · Chưa có → 3 gói (đúng bảng đã công bố), chọn thời hạn, mua bằng số dư ví.
// Giá do máy chủ tự tính lại lúc mua (/api/hoi-vien/mua) — số ở đây chỉ để xem.
// ============================================================================

type GoiCuaToi = { id: number; ten_goi: string; goi: string; so_thang: number; bat_dau: string; het_han: string };
type VoucherCuaToi = { loai: LoaiVoucher; giam: number; so_luong: number; con_lai: number; den: string };

const ngay = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const dongVN = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";

export default function Trang() {
  return (
    <Suspense fallback={<p className="text-sm text-cvr-muted">Đang tải…</p>}>
      <GoiHoiVienCuaToi />
    </Suspense>
  );
}

function GoiHoiVienCuaToi() {
  const { billing, loading: dangTaiGia } = useBilling();
  const { profile } = useProfile();
  const chon = useSearchParams().get("goi");
  const [goi, setGoi] = useState<GoiCuaToi | null | undefined>(undefined);
  const [voucher, setVoucher] = useState<VoucherCuaToi[]>([]);
  const [thang, setThang] = useState<number | null>(null);
  const [dangMua, setDangMua] = useState(false);
  const [thongBao, setThongBao] = useState<{ ok: boolean; text: string } | null>(null);
  // Điều kiện gói: chữ lấy từ admin (một nguồn duy nhất), chưa tải xong thì dùng mặc định.
  const [dieuKien, setDieuKien] = useState<string[]>(ghepQuyDinh(null).dieuKienHoiVien);
  useEffect(() => {
    createClient().from("site_content").select("data").eq("key", KHOA_QUY_DINH_GIA).limit(1)
      .then(({ data }) => setDieuKien(ghepQuyDinh(data?.[0]?.data as Partial<QuyDinhGia> | undefined).dieuKienHoiVien));
  }, []);

  const tai = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return setGoi(null);
    // Cấp voucher kỳ 30 ngày hiện tại (nếu vừa sang kỳ mới) rồi mới đọc.
    await sb.rpc("cap_voucher_hoi_vien", { p_user: user.id });
    const { data: g } = await sb.from("hoi_vien").select("id,ten_goi,goi,so_thang,bat_dau,het_han")
      .eq("user_id", user.id).gt("het_han", new Date().toISOString()).order("het_han", { ascending: false }).limit(1);
    const hienTai = (g?.[0] as GoiCuaToi | undefined) ?? null;
    setGoi(hienTai);
    if (hienTai) {
      const bayGio = new Date().toISOString();
      const { data: v } = await sb.from("hoi_vien_voucher").select("loai,giam,so_luong,con_lai,den")
        .eq("hoi_vien_id", hienTai.id).lte("tu", bayGio).gt("den", bayGio);
      setVoucher((v ?? []) as VoucherCuaToi[]);
    }
  }, []);
  useEffect(() => { void tai(); }, [tai]);

  const dsGoi = billing.hoiVien ?? [];
  const goiChon = dsGoi.find((g) => g.id === chon) ?? null;
  const ky = goiChon?.thoiHan.find((t) => t.thang === thang) ?? goiChon?.thoiHan[0] ?? null;
  const soDu = Number((profile as unknown as { balance?: number } | null)?.balance ?? 0);

  async function mua() {
    if (!goiChon || !ky) return;
    setDangMua(true);
    setThongBao(null);
    const res = await fetch("/api/hoi-vien/mua", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goi: goiChon.id, thang: ky.thang }),
    });
    const kq = await res.json().catch(() => ({}));
    setDangMua(false);
    if (!res.ok || !kq.ok) return setThongBao({ ok: false, text: kq.loi || "Chưa mua được gói, thử lại sau." });
    setThongBao({ ok: true, text: `Đã kích hoạt ${goiChon.ten} đến ${ngay(kq.hetHan)}. Voucher đã sẵn sàng.` });
    await tai();
  }

  if (goi === undefined || dangTaiGia) return <p className="text-sm text-cvr-muted">Đang tải…</p>;

  return (
    <div className="space-y-5">
      <PageHeader title="Gói hội viên" />

      {thongBao && (
        <p className={`rounded-xl px-4 py-3 text-sm ${thongBao.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{thongBao.text}</p>
      )}

      {goi ? (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <p className="text-sm text-cvr-muted">Gói đang dùng</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-cvr-ink">{goi.ten_goi}</p>
          <p className="mt-1 text-sm text-cvr-body">Hết hạn {ngay(goi.het_han)}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-cvr-muted">Voucher kỳ này</p>
          {voucher.length ? (
            <ul className="mt-2 divide-y divide-cvr-line/70">
              {voucher.map((v) => (
                <li key={v.loai} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="text-cvr-body">Giảm {dongVN(tachThue(v.giam).tongTra)}/lần {TEN_VOUCHER[v.loai]}</span>
                  <span className="shrink-0 tabular-nums text-cvr-ink"><b>{v.con_lai}</b>/{v.so_luong} · hạn {ngay(v.den)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-cvr-muted">Kỳ này không còn voucher.</p>
          )}
          <p className="mt-3 text-[13px] text-cvr-muted">Voucher tự trừ khi tin được duyệt hoặc khi đẩy tin thường.</p>
        </section>
      ) : !dsGoi.length ? (
        <p className="rounded-2xl border border-cvr-line bg-white p-6 text-center text-sm text-cvr-muted">Gói hội viên sắp mở bán.</p>
      ) : goiChon ? (
        <section className="rounded-2xl border border-cvr-line bg-white p-5 shadow-sm">
          <p className="text-sm text-cvr-muted">Mua gói</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-cvr-ink">{goiChon.ten}</p>
          <div className="mt-4 space-y-2">
            {goiChon.thoiHan.map((t) => (
              <label key={t.thang} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${ky?.thang === t.thang ? "border-cvr-ink" : "border-cvr-line hover:border-cvr-ink/40"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="thang" checked={ky?.thang === t.thang} onChange={() => setThang(t.thang)} />
                  <span className="text-[15px] font-medium text-cvr-ink">{t.thang} tháng</span>
                </span>
                <span className="text-right tabular-nums">
                  <b className="font-semibold text-cvr-ink">{giaTra(t.price)}</b>
                  {t.thang > 1 && <span className="block text-[11px] text-cvr-muted">≈ {dongVN(tachThue(t.price / t.thang).tongTra)}/tháng</span>}
                </span>
              </label>
            ))}
          </div>
          {ky && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cvr-line pt-4">
              <p className="text-sm text-cvr-body">
                Thanh toán <b className="text-cvr-ink">{giaTra(ky.price)}</b> từ ví · số dư {vnd(soDu)}
              </p>
              {soDu >= tachThue(ky.price).tongTra ? (
                <button type="button" onClick={mua} disabled={dangMua}
                  className="h-11 rounded-full bg-cvr-ink px-6 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60">
                  {dangMua ? "Đang kích hoạt…" : "Xác nhận mua"}
                </button>
              ) : (
                <Link href={`/tai-khoan/nap-tien?can=${tachThue(ky.price).tongTra - soDu}`}
                  className="flex h-11 items-center rounded-full bg-cvr-ink px-6 text-sm font-semibold text-white">Nạp thêm {vnd(tachThue(ky.price).tongTra - soDu)}</Link>
              )}
            </div>
          )}
          <Link href="/tai-khoan/hoi-vien" className="mt-3 inline-block text-sm text-cvr-muted hover:text-cvr-ink">← Xem các gói khác</Link>
          <DieuKienHoiVien dong={dieuKien} />
        </section>
      ) : (
        <>
          <GoiHoiVienCards goi={dsGoi} />
          <DieuKienHoiVien dong={dieuKien} />
        </>
      )}
    </div>
  );
}

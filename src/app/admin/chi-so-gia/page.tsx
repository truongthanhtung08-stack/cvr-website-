"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChiSoGiaData, ChiSoKhuVuc, LoiCsv } from "@/lib/chiSoGia";
import { docBangChiSo, docCsvChiSo, TINH_MIEN_TRUNG } from "@/lib/chiSoGia";
import { docBangXlsx, laXlsx } from "@/lib/docXlsx";
import { chuanTen, provinceNamesFor } from "@/lib/locations";
import { taiCsv, homNay } from "@/lib/xuatCsv";

// ════════════════════════════════════════════════════════════════════════════
// LỊCH SỬ GIÁ — NHẬP SỐ VÀO ĐÂY, TRANG TIN HIỆN NGAY.
//
// Mỗi dãy số được định danh bằng BỐN chiều, thiếu một chiều là số vô nghĩa:
//      Tỉnh/Thành  ×  Khu vực (phường/xã)  ×  Loại hình  ×  Bán / Cho thuê
// rồi trong mỗi dãy là giá mỗi m² theo từng KỲ (quý hoặc năm).
//
// Hai đường nhập:
//   · TỆP CSV — nhanh, dùng khi có bảng số sẵn (đây là đường chính).
//   · Gõ tay — dùng khi chỉ sửa vài ô.
//
// Số nhập vào là giá mỗi m², đơn vị TRIỆU ĐỒNG (gõ 78,5 = 78,5 triệu/m²).
// Với tin cho thuê thì là giá thuê mỗi m² mỗi tháng (0,25 = 250 nghìn/m²/tháng).
// ════════════════════════════════════════════════════════════════════════════

const NGUON_GOI_Y = [
  "Khảo sát của Coastal Land",
  "CBRE",
  "Savills",
  "DKRA",
  "JLL",
  "Bộ Xây dựng",
  "Sở Xây dựng tỉnh",
];

const inputCls =
  "h-11 w-full rounded-lg border border-transparent bg-cvr-surface px-3 text-sm text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-line focus:bg-white";

/** "78,5" → 78500000 đồng/m² */
function doiSangDong(s: string): number {
  const v = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? Math.round(v * 1_000_000) : 0;
}
/** 78500000 → "78,5" */
function doiSangTrieu(v: number): string {
  if (!v) return "";
  return String(Math.round((v / 1_000_000) * 100) / 100).replace(".", ",");
}

function quyGanDay(n: number): string[] {
  const ra: string[] = [];
  const d = new Date();
  let nam = d.getFullYear();
  let quy = Math.floor(d.getMonth() / 3) + 1;
  for (let i = 0; i < n; i++) {
    ra.unshift(`${nam}-Q${quy}`);
    quy--;
    if (quy === 0) {
      quy = 4;
      nam--;
    }
  }
  return ra;
}

/** Khoá định danh một dãy số — trùng khoá thì lần nhập sau ghi đè lần trước. */
function khoaDay(x: ChiSoKhuVuc): string {
  return [chuanTen(x.tinh), chuanTen(x.khuVuc ?? ""), chuanTen(x.loaiHinh ?? ""), x.mucDich ?? "ban"].join("|");
}

export default function ChiSoGiaPage() {
  const [items, setItems] = useState<ChiSoKhuVuc[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [msg, setMsg] = useState("");
  const [kho, setKho] = useState<{ dong: number; thang: string[]; khuVuc: number } | null>(null);
  const [dangXuat, setDangXuat] = useState(false);
  const [xemTruoc, setXemTruoc] = useState<{ items: ChiSoKhuVuc[]; loi: LoiCsv[] } | null>(null);
  const oTep = useRef<HTMLInputElement>(null);

  // Tỉnh Miền Trung xếp lên đầu — đó là phạm vi kinh doanh hiện tại, 90% thao
  // tác rơi vào đây; các tỉnh còn lại vẫn chọn được, chỉ nằm dưới.
  const moiTinh = provinceNamesFor("moi");
  const tinhs = [
    ...TINH_MIEN_TRUNG.filter((t) => moiTinh.includes(t)),
    ...moiTinh.filter((t) => !TINH_MIEN_TRUNG.includes(t)),
  ];

  async function xuatKho() {
    setDangXuat(true);
    const ds: Record<string, unknown>[] = [];
    for (let tu = 0; ; tu += 1000) {
      const { data } = await createClient()
        .from("gia_khu_vuc_thang")
        .select("thang,tinh,phuong,loai_hinh,muc_dich,trung_vi,thap,cao,so_mau")
        .order("thang", { ascending: true })
        .range(tu, tu + 999);
      if (!data?.length) break;
      ds.push(...data);
      if (data.length < 1000) break;
    }
    setDangXuat(false);
    if (!ds.length) {
      setMsg("Kho chưa có dòng nào để tải.");
      return;
    }
    taiCsv(
      `kho-gia-khu-vuc-${homNay()}.csv`,
      ["Tháng", "Tỉnh/Thành", "Phường/Xã", "Loại hình", "Bán/Thuê", "Trung vị (triệu/m²)", "Thấp (triệu/m²)", "Cao (triệu/m²)", "Số tin làm mẫu"],
      ds.map((r) => [
        r.thang,
        r.tinh,
        r.phuong || "(cả tỉnh)",
        r.loai_hinh,
        r.muc_dich === "thue" ? "Cho thuê" : "Bán",
        (Number(r.trung_vi) / 1e6).toFixed(1).replace(".", ","),
        (Number(r.thap) / 1e6).toFixed(1).replace(".", ","),
        (Number(r.cao) / 1e6).toFixed(1).replace(".", ","),
        r.so_mau,
      ]),
    );
  }

  async function chonTep(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg("");
    try {
      // Excel thì đọc thẳng, khỏi bắt ai "Save As CSV" — đó là chỗ hay hỏng nhất.
      setXemTruoc(laXlsx(f) ? docBangChiSo(await docBangXlsx(f)) : docCsvChiSo(await f.text()));
    } catch (err) {
      setMsg(`Lỗi: không đọc được tệp — ${err instanceof Error ? err.message : "định dạng lạ"}`);
    }
  }

  /** Trộn dữ liệu CSV vào danh sách hiện có: trùng khoá thì thay, mới thì thêm. */
  function nhanCsv() {
    if (!xemTruoc?.items.length) return;
    setItems((cu) => {
      const map = new Map(cu.map((x) => [khoaDay(x), x]));
      for (const x of xemTruoc.items) map.set(khoaDay(x), x);
      return [...map.values()];
    });
    setXemTruoc(null);
    if (oTep.current) oTep.current.value = "";
    setMsg("Đã nạp vào danh sách bên dưới — kiểm tra rồi bấm Lưu.");
  }

  useEffect(() => {
    void (async () => {
      const { data } = await createClient()
        .from("site_content")
        .select("data")
        .eq("key", "chi_so_gia")
        .limit(1);
      const d = (data?.[0]?.data ?? null) as ChiSoGiaData | null;
      setItems(d?.items ?? []);

      const { data: g } = await createClient()
        .from("gia_khu_vuc_thang")
        .select("thang, tinh, phuong, loai_hinh")
        .limit(5000);
      if (g) {
        const thang = [...new Set(g.map((x) => String(x.thang).slice(0, 7)))].sort();
        const kv = new Set(g.map((x) => `${x.tinh}|${x.phuong}|${x.loai_hinh}`));
        setKho({ dong: g.length, thang, khuVuc: kv.size });
      }
      setDangTai(false);
    })();
  }, []);

  async function luu() {
    setMsg("");
    const sach = items.filter((x) => x.tinh && x.moc.some((m) => m.giaM2 > 0));
    const { error } = await createClient()
      .from("site_content")
      .upsert({ key: "chi_so_gia", data: { items: sach } as ChiSoGiaData });
    setMsg(error ? `Lỗi: ${error.message}` : `Đã lưu ${sach.length} dãy số — trang tin hiện ngay.`);
  }

  const themKhuVuc = () =>
    setItems((v) => [
      ...v,
      {
        tinh: "Đà Nẵng",
        loaiHinh: "Nhà riêng",
        mucDich: "ban",
        nguon: "Khảo sát của Coastal Land",
        capNhat: homNay(),
        moc: quyGanDay(6).map((q) => ({ quy: q, giaM2: 0 })),
      },
    ]);

  const sua = (i: number, v: Partial<ChiSoKhuVuc>) =>
    setItems((ds) => ds.map((x, k) => (k === i ? { ...x, ...v } : x)));

  if (dangTai) return <p className="p-1 text-sm text-cvr-muted">Đang tải…</p>;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Lịch sử giá</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Giá mỗi m² theo <strong>tỉnh × khu vực × loại hình × bán/thuê</strong>, từng quý hoặc từng
          năm. Nhập xong bấm Lưu là trang tin vẽ biểu đồ ngay.
        </p>
      </div>

      {msg && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm ${
            msg.startsWith("Lỗi") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {msg}
        </p>
      )}

      {/* ── NHẬP NHANH BẰNG CSV ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-cvr-ink">Nhập nhanh bằng tệp Excel</p>
        <p className="mt-1 text-[13px] leading-relaxed text-cvr-muted">
          Mỗi dòng là <strong>một kỳ của một dãy</strong>. Các dòng cùng tỉnh + khu vực + loại hình
          + bán/thuê tự gom thành một đường trên biểu đồ. Điền thêm{" "}
          <code>gia_thap_trieu</code> và <code>gia_cao_trieu</code> thì biểu đồ vẽ đủ{" "}
          <strong>ba đường: phổ biến · cao nhất · thấp nhất</strong>.
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[12.5px]">
            <thead className="text-cvr-muted">
              <tr>
                {["tinh", "khu_vuc", "loai_hinh", "muc_dich", "ky", "gia_m2_trieu", "gia_thap_trieu", "gia_cao_trieu", "nguon", "cap_nhat", "so_mau", "nguon_link"].map((c) => (
                  <th key={c} className="border-b border-cvr-line py-1.5 pr-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-cvr-body">
              <tr>
                <td className="py-1.5 pr-3">Đà Nẵng</td>
                <td className="py-1.5 pr-3 text-cvr-faint">(trống = cả tỉnh)</td>
                <td className="py-1.5 pr-3">Nhà riêng</td>
                <td className="py-1.5 pr-3">ban</td>
                <td className="py-1.5 pr-3">2025-Q1</td>
                <td className="py-1.5 pr-3">78,5</td>
                <td className="py-1.5 pr-3">62,0</td>
                <td className="py-1.5 pr-3">95,0</td>
                <td className="py-1.5 pr-3">CBRE</td>
                <td className="py-1.5 pr-3">2026-09-11</td>
                <td className="py-1.5 pr-3 text-cvr-faint">40</td>
                <td className="py-1.5 pr-3 text-cvr-faint">link báo cáo</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-3">Huế</td>
                <td className="py-1.5 pr-3">Phường An Cựu</td>
                <td className="py-1.5 pr-3">Nhà mặt phố</td>
                <td className="py-1.5 pr-3">thue</td>
                <td className="py-1.5 pr-3">2025</td>
                <td className="py-1.5 pr-3">0,25</td>
                <td className="py-1.5 pr-3 text-cvr-faint">—</td>
                <td className="py-1.5 pr-3 text-cvr-faint">—</td>
                <td className="py-1.5 pr-3">Khảo sát của Coastal Land</td>
                <td className="py-1.5 pr-3">2026-09-11</td>
                <td className="py-1.5 pr-3 text-cvr-faint">22</td>
                <td className="py-1.5 pr-3 text-cvr-faint">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Mẫu tĩnh ở public/ — đã dựng sẵn khung Đà Nẵng + Huế × 10 loại hình
              × 8 quý, chỉ việc điền cột giá rồi tải lên. */}
          <a
            href="/mau-lich-su-gia.xlsx"
            download
            className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Tải tệp mẫu Excel (đã dựng sẵn khung)
          </a>
          <input
            ref={oTep}
            type="file"
            accept=".xlsx,.csv"
            onChange={chonTep}
            className="block max-w-full text-sm text-cvr-body file:mr-3 file:rounded-lg file:border-0 file:bg-cvr-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>

        {xemTruoc && (
          <div className="mt-3 rounded-xl bg-cvr-surface p-4">
            <p className="text-[13px] text-cvr-body">
              Đọc được <strong>{xemTruoc.items.length}</strong> dãy số ·{" "}
              <strong>{xemTruoc.items.reduce((s, x) => s + x.moc.length, 0)}</strong> mốc kỳ
              {xemTruoc.loi.length > 0 && (
                <>
                  {" "}
                  · <span className="font-semibold text-red-600">{xemTruoc.loi.length} dòng lỗi</span>
                </>
              )}
            </p>
            {/* Cột so_mau là tuỳ chọn, nhưng có điền thì cảnh báo luôn dãy mỏng —
                dưới 20 mẫu thì con số nói lên rất ít, nên bổ sung trước khi lưu. */}
            {(() => {
              const mong = xemTruoc.items.reduce(
                (s, x) => s + x.moc.filter((m) => m.soMau !== undefined && m.soMau < 20).length,
                0,
              );
              return mong > 0 ? (
                <p className="mt-2 text-[12.5px] font-medium text-amber-700">
                  {mong} kỳ có dưới 20 mẫu — số mỏng, nên thu thập thêm trước khi công bố.
                </p>
              ) : null;
            })()}
            {xemTruoc.items.length > 0 && (
              <ul className="mt-2 space-y-1 text-[12.5px] text-cvr-muted">
                {xemTruoc.items.slice(0, 8).map((x, i) => (
                  <li key={i}>
                    {x.tinh}
                    {x.khuVuc ? ` · ${x.khuVuc}` : ""} · {x.loaiHinh || "mọi loại hình"} ·{" "}
                    {x.mucDich === "thue" ? "cho thuê" : "bán"} — {x.moc.length} kỳ
                  </li>
                ))}
                {xemTruoc.items.length > 8 && <li>… và {xemTruoc.items.length - 8} dãy nữa</li>}
              </ul>
            )}
            {xemTruoc.loi.length > 0 && (
              <ul className="mt-2 space-y-1 text-[12.5px] text-red-700">
                {xemTruoc.loi.slice(0, 6).map((l, i) => (
                  <li key={i}>
                    Dòng {l.dong}: {l.ly}
                  </li>
                ))}
                {xemTruoc.loi.length > 6 && <li>… và {xemTruoc.loi.length - 6} lỗi nữa</li>}
              </ul>
            )}
            {xemTruoc.items.length > 0 && (
              <button
                type="button"
                onClick={nhanCsv}
                className="mt-3 rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
              >
                Nạp vào danh sách
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── KHO GIÁ TỰ THU THẬP ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-cvr-ink">Kho giá web tự thu thập</p>
        {kho === null ? (
          <p className="mt-1 text-[13px] text-cvr-muted">
            Chưa đọc được kho — bảng <code>gia_khu_vuc_thang</code> có thể chưa tạo. Chạy tệp
            <code className="mx-1">0026_kho_gia_khu_vuc.sql</code> trong Supabase → SQL Editor.
          </p>
        ) : kho.dong === 0 ? (
          <p className="mt-1 text-[13px] text-cvr-muted">
            Kho còn trống. Web tự chụp mặt bằng giá mỗi ngày một lần, mỗi tháng ghi lại một mốc.
            Vài ngày nữa quay lại đây sẽ thấy số.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[12px] text-cvr-muted">Mốc tháng đã có</p>
              <p className="mt-0.5 text-[19px] font-bold text-cvr-ink">{kho.thang.length}</p>
            </div>
            <div>
              <p className="text-[12px] text-cvr-muted">Khu vực × loại hình</p>
              <p className="mt-0.5 text-[19px] font-bold text-cvr-ink">{kho.khuVuc}</p>
            </div>
            <div>
              <p className="text-[12px] text-cvr-muted">Tổng dòng</p>
              <p className="mt-0.5 text-[19px] font-bold text-cvr-ink">{kho.dong}</p>
            </div>
          </div>
        )}
        {kho && kho.dong > 0 && (
          <button
            type="button"
            onClick={xuatKho}
            disabled={dangXuat}
            className="mt-3 rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink disabled:opacity-60"
          >
            {dangXuat ? "Đang tải…" : "Tải toàn bộ kho ra CSV (để làm báo cáo)"}
          </button>
        )}
        {kho && kho.thang.length > 0 && (
          <p className="mt-2 text-[12px] text-cvr-faint">
            Từ {kho.thang[0]} đến {kho.thang[kho.thang.length - 1]} · đủ 2 quý trở lên là trang tin
            tự vẽ xu hướng bằng số của mình, không cần số nhập tay nữa.
          </p>
        )}
      </div>

      {/* ── DANH SÁCH DÃY SỐ ───────────────────────────────────────────── */}
      {items.map((kv, i) => (
        <div key={i} className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">Tỉnh / Thành</span>
              <select value={kv.tinh} onChange={(e) => sua(i, { tinh: e.target.value })} className={inputCls}>
                {tinhs.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">
                Khu vực <span className="text-cvr-faint">(trống = cả tỉnh)</span>
              </span>
              <input
                value={kv.khuVuc ?? ""}
                onChange={(e) => sua(i, { khuVuc: e.target.value || undefined })}
                placeholder="VD: Phường An Cựu"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">
                Loại hình <span className="text-cvr-faint">(trống = mọi loại)</span>
              </span>
              <input
                value={kv.loaiHinh ?? ""}
                onChange={(e) => sua(i, { loaiHinh: e.target.value || undefined })}
                placeholder="VD: Căn hộ chung cư"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">Bán / Cho thuê</span>
              <select
                value={kv.mucDich ?? "ban"}
                onChange={(e) => sua(i, { mucDich: e.target.value === "thue" ? "thue" : "ban" })}
                className={inputCls}
              >
                <option value="ban">Bán</option>
                <option value="thue">Cho thuê</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">Nguồn số liệu</span>
              <input
                list={`nguon-${i}`}
                value={kv.nguon}
                onChange={(e) => sua(i, { nguon: e.target.value })}
                className={inputCls}
              />
              <datalist id={`nguon-${i}`}>
                {NGUON_GOI_Y.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">Ngày cập nhật</span>
              <input
                type="date"
                value={kv.capNhat}
                onChange={(e) => sua(i, { capNhat: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-[13px] font-medium text-cvr-body">
                Link nguồn <span className="text-cvr-faint">(để kiểm chứng lại sau, không hiện ra web)</span>
              </span>
              <input
                value={kv.nguonLink ?? ""}
                onChange={(e) => sua(i, { nguonLink: e.target.value || undefined })}
                placeholder="Dán link báo cáo hoặc trang đã lấy số"
                className={inputCls}
              />
            </label>
          </div>

          <p className="mt-4 text-[13px] font-medium text-cvr-body">
            Giá mỗi m² — đơn vị <strong>triệu đồng</strong>
            {(kv.mucDich ?? "ban") === "thue" ? " mỗi tháng (0,25 = 250 nghìn/m²/tháng)" : " (78,5 = 78,5 triệu/m²)"}
          </p>
          <p className="mt-1 text-[12px] text-cvr-faint">
            Điền đủ cả Thấp và Cao cho <strong>mọi kỳ</strong> thì biểu đồ vẽ ba đường; thiếu một kỳ
            là chỉ còn một đường Phổ biến.
          </p>
          {/* Mỗi kỳ một cột ba ô: phổ biến / thấp / cao — nhìn theo cột là thấy
              ngay kỳ nào còn khuyết, không phải dò ngang. */}
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kv.moc.map((m, k) => {
              const doiMoc = (v: Partial<{ giaM2: number; thap?: number; cao?: number }>) =>
                sua(i, { moc: kv.moc.map((x, j) => (j === k ? { ...x, ...v } : x)) });
              return (
                <div key={m.quy} className="rounded-xl bg-cvr-surface p-2.5">
                  <p className="mb-1.5 text-[12px] font-medium text-cvr-body">
                    {m.quy.replace("-", " ")}
                  </p>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={doiSangTrieu(m.giaM2)}
                      onChange={(e) => doiMoc({ giaM2: doiSangDong(e.target.value) })}
                      placeholder="Phổ biến"
                      aria-label={`Giá phổ biến ${m.quy}`}
                      className="h-10 w-full rounded-lg border border-transparent bg-white px-2.5 text-sm font-medium text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={doiSangTrieu(m.thap ?? 0)}
                        onChange={(e) => doiMoc({ thap: doiSangDong(e.target.value) || undefined })}
                        placeholder="Thấp"
                        aria-label={`Giá thấp nhất ${m.quy}`}
                        className="h-9 w-full rounded-lg border border-transparent bg-white px-2.5 text-[13px] text-cvr-body placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={doiSangTrieu(m.cao ?? 0)}
                        onChange={(e) => doiMoc({ cao: doiSangDong(e.target.value) || undefined })}
                        placeholder="Cao"
                        aria-label={`Giá cao nhất ${m.quy}`}
                        className="h-9 w-full rounded-lg border border-transparent bg-white px-2.5 text-[13px] text-cvr-body placeholder-cvr-faint outline-none transition focus:border-cvr-ink"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setItems((ds) => ds.filter((_, k) => k !== i))}
            className="mt-4 text-[13px] font-medium text-red-600 hover:underline"
          >
            Xoá dãy này
          </button>
        </div>
      ))}

      <div className="sticky bottom-0 flex flex-wrap gap-3 bg-white/90 py-3 backdrop-blur">
        <button
          type="button"
          onClick={themKhuVuc}
          className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm dãy số
        </button>
        <button
          type="button"
          onClick={luu}
          className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90"
        >
          Lưu
        </button>
      </div>

      <div className="rounded-2xl bg-cvr-surface p-4 text-[13px] leading-relaxed text-cvr-muted">
        <p className="font-semibold text-cvr-ink">Nguyên tắc</p>
        <p className="mt-1">
          Phạm vi {TINH_MIEN_TRUNG.length} tỉnh Miền Trung. Kỳ nào không có số thì{" "}
          <strong>để trống</strong>, đừng điền ước chừng. Lấy số từ sàn khác cũng được, web ghi
          nguồn là <strong>“báo cáo thị trường tổng hợp”</strong>, không nêu tên họ.
        </p>
        <p className="mt-2">
          Tài liệu đầy đủ: <code>docs/DU-LIEU-GIA.md</code>
        </p>
      </div>
    </div>
  );
}

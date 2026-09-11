"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChiSoGiaData, ChiSoKhuVuc } from "@/lib/chiSoGia";
import { provinceNamesFor } from "@/lib/locations";
import { taiCsv, homNay } from "@/lib/xuatCsv";

// ════════════════════════════════════════════════════════════════════════════
// CHỈ SỐ GIÁ THEO QUÝ — chủ dự án nhập tay mỗi quý một lần.
//
// Web chưa đủ tin để tự tính xu hướng nhiều quý, nên giai đoạn đầu lấy số từ báo
// cáo thị trường công bố công khai (Batdongsan · CBRE · Savills · DKRA). Nhập ở
// đây, trang tin hiện ngay — không phải sửa code.
//
// Số nhập vào là GIÁ TRUNG BÌNH MỖI M², đơn vị TRIỆU ĐỒNG (gõ 78,5 nghĩa là
// 78,5 triệu/m²). Chưa nhập khu vực nào thì trang tin không vẽ biểu đồ xu hướng,
// chỉ còn mặt bằng giá tính từ tin đang đăng.
// ════════════════════════════════════════════════════════════════════════════

// Gợi ý nguồn để chủ dự án chọn nhanh. Ghi tên nào ở đây cũng được — riêng tên
// các sàn đối thủ thì web TỰ ĐỔI thành "báo cáo thị trường tổng hợp" khi hiện ra
// cho khách, không quảng cáo không công cho họ (xem tenNguonHienThi).
const NGUON_GOI_Y = ["CBRE", "Savills", "DKRA", "JLL", "Bộ Xây dựng", "Tự khảo sát"];

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
  return String(Math.round((v / 1_000_000) * 10) / 10).replace(".", ",");
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

export default function ChiSoGiaPage() {
  const [items, setItems] = useState<ChiSoKhuVuc[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [msg, setMsg] = useState("");
  const [kho, setKho] = useState<{ dong: number; thang: string[]; khuVuc: number } | null>(null);
  const [dangXuat, setDangXuat] = useState(false);

  // Tải TOÀN BỘ kho giá ra CSV để chủ dự án tự làm báo cáo thống kê bằng Excel,
  // khỏi phải vào Supabase gõ lệnh.
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
  const tinhs = provinceNamesFor("moi");

  useEffect(() => {
    void (async () => {
      const { data } = await createClient()
        .from("site_content")
        .select("data")
        .eq("key", "chi_so_gia")
        .limit(1);
      const d = (data?.[0]?.data ?? null) as ChiSoGiaData | null;
      setItems(d?.items ?? []);

      // Kho giá tích luỹ — cho thấy dữ liệu của CHÍNH MÌNH đang dày tới đâu.
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
    setMsg(error ? `Lỗi: ${error.message}` : "Đã lưu — trang tin hiện ngay.");
  }

  const themKhuVuc = () =>
    setItems((v) => [
      ...v,
      {
        tinh: "Đà Nẵng",
        nguon: "Batdongsan.com.vn",
        capNhat: new Date().toISOString().slice(0, 10),
        moc: quyGanDay(6).map((q) => ({ quy: q, giaM2: 0 })),
      },
    ]);

  const sua = (i: number, v: Partial<ChiSoKhuVuc>) =>
    setItems((ds) => ds.map((x, k) => (k === i ? { ...x, ...v } : x)));

  if (dangTai) return <p className="p-1 text-sm text-cvr-muted">Đang tải…</p>;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Chỉ số giá theo quý</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Số lấy từ báo cáo thị trường công bố công khai. Nhập xong bấm Lưu, trang tin hiện ngay và
          ghi rõ nguồn bên dưới biểu đồ.
        </p>
      </div>

      {/* KHO DỮ LIỆU CỦA CHÍNH MÌNH — mỗi tháng web tự chụp mặt bằng giá một lần
          rồi giữ lại. Đủ vài quý là tự vẽ được xu hướng, không phải mượn số nữa. */}
      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-cvr-ink">Kho giá tự thu thập</p>
        {kho === null ? (
          <p className="mt-1 text-[13px] text-cvr-muted">
            Chưa đọc được kho — bảng <code>gia_khu_vuc_thang</code> có thể chưa tạo. Chạy tệp
            <code className="mx-1">0026_kho_gia_khu_vuc.sql</code> trong Supabase → SQL Editor.
          </p>
        ) : kho.dong === 0 ? (
          <p className="mt-1 text-[13px] text-cvr-muted">
            Kho còn trống. Web tự chụp mặt bằng giá mỗi ngày một lần (chạy kèm việc nhắc hoá đơn),
            mỗi tháng ghi lại một mốc. Vài ngày nữa quay lại đây sẽ thấy số.
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
            tự vẽ xu hướng bằng số của mình, không dùng số nhập tay bên dưới nữa.
          </p>
        )}
      </div>

      {msg && (
        <p
          className={`rounded-lg px-4 py-2.5 text-sm ${
            msg.startsWith("Đã lưu") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg}
        </p>
      )}

      {items.map((kv, i) => (
        <div key={i} className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>

          <p className="mt-4 text-[13px] font-medium text-cvr-body">
            Giá trung bình mỗi m² — đơn vị <strong>triệu đồng</strong> (gõ 78,5 = 78,5 triệu/m²)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {kv.moc.map((m, k) => (
              <label key={m.quy} className="block">
                <span className="mb-1 block text-[12px] text-cvr-muted">{m.quy.replace("-", " ")}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={doiSangTrieu(m.giaM2)}
                  onChange={(e) =>
                    sua(i, {
                      moc: kv.moc.map((x, j) =>
                        j === k ? { ...x, giaM2: doiSangDong(e.target.value) } : x,
                      ),
                    })
                  }
                  placeholder="—"
                  className={inputCls}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setItems((ds) => ds.filter((_, k) => k !== i))}
            className="mt-4 text-[13px] font-medium text-red-600 hover:underline"
          >
            Xoá khu vực này
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={themKhuVuc}
          className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
        >
          + Thêm khu vực
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
        <p className="font-semibold text-cvr-ink">Lấy số ở đâu</p>
        <p className="mt-1">
          Báo cáo thị trường quý của CBRE, Savills, DKRA, JLL đều công bố công khai, tải về đọc
          miễn phí. Bộ Xây dựng cũng công bố chỉ số giá giao dịch bất động sản theo quý. Mỗi quý
          vào đây cập nhật một lần là đủ.
        </p>
        <p className="mt-2">
          Khu vực nào chưa nhập thì trang tin <strong>không vẽ biểu đồ</strong> — chỉ hiện mặt bằng
          giá tính từ tin đang đăng trên web. Thiếu thì để trống, đừng điền số ước chừng.
          <br />
          Lấy số từ sàn khác cũng được, nhưng web sẽ ghi là{" "}
          <strong>“báo cáo thị trường tổng hợp”</strong> chứ không nêu tên họ.
        </p>
      </div>
    </div>
  );
}

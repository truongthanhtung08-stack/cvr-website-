"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TINH_MIEN_TRUNG, vndM2 } from "@/lib/chiSoGia";

// ════════════════════════════════════════════════════════════════════════════
// TRA CỨU GIÁ ĐẤT NHÀ NƯỚC — công cụ riêng, KHÔNG gắn vào từng tin đăng.
//
// Giá trong quyết định của UBND tỉnh là con số để tính thuế trước bạ, phí công
// chứng, thuế thu nhập khi bán. Nó là văn bản pháp quy nên đặt ở mục tiện ích
// cho khách chủ động tra, hợp hơn là nhét vào khối giá thị trường của một tin
// (hai con số khác bản chất, đứng cạnh nhau dễ làm người xem lẫn).
//
// Bảng chia theo TUYẾN ĐƯỜNG × ĐOẠN × VỊ TRÍ nên tra theo tên đường, gõ không
// dấu cũng ra. Chưa có dữ liệu tỉnh nào thì nói thẳng là chưa có.
// ════════════════════════════════════════════════════════════════════════════

type Dong = {
  phuong: string;
  duong: string;
  doan: string;
  vi_tri: number;
  gia_m2: number;
  can_cu: string;
  hieu_luc_tu: string | null;
};

const inputCls =
  "h-12 w-full rounded-xl border border-cvr-line bg-white px-4 text-[15px] text-cvr-ink placeholder-cvr-faint outline-none transition focus:border-cvr-ink";

export default function TraCuuGiaDat() {
  const [tinh, setTinh] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [ds, setDs] = useState<Dong[] | null>(null);
  const [dangTim, setDangTim] = useState(false);
  // Danh sách tỉnh CHỈ gồm nơi đã có bảng giá. Liệt kê cả nước rồi ghi "chưa có
  // dữ liệu" bên cạnh là tự trưng chỗ trống của mình ra cho khách đếm.
  const [tinhCoSo, setTinhCoSo] = useState<string[] | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await createClient().from("gia_dat_nha_nuoc").select("tinh").limit(5000);
      const co = data ? [...new Set(data.map((x) => String(x.tinh)))] : [];
      // Miền Trung lên đầu — phạm vi kinh doanh hiện tại.
      const xep = [
        ...TINH_MIEN_TRUNG.filter((t) => co.includes(t)),
        ...co.filter((t) => !TINH_MIEN_TRUNG.includes(t)).sort(),
      ];
      setTinhCoSo(xep);
      if (xep.length) setTinh((t) => t || xep[0]);
    })();
  }, []);

  async function tim() {
    setDangTim(true);
    let q = createClient()
      .from("gia_dat_nha_nuoc")
      .select("phuong,duong,doan,vi_tri,gia_m2,can_cu,hieu_luc_tu")
      .eq("tinh", tinh)
      .order("duong", { ascending: true })
      .order("vi_tri", { ascending: true })
      .limit(200);
    if (tuKhoa.trim()) q = q.ilike("duong", `%${tuKhoa.trim()}%`);
    const { data } = await q;
    setDs(data ?? []);
    setDangTim(false);
  }

  // Kho chưa có tỉnh nào thì công cụ không hiện — không có gì để tra thì đừng
  // bày ra một ô tìm kiếm rỗng.
  if (tinhCoSo !== null && tinhCoSo.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]">
        <select value={tinh} onChange={(e) => setTinh(e.target.value)} className={inputCls} aria-label="Tỉnh/Thành">
          {(tinhCoSo ?? []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void tim()}
          placeholder="Tên đường, VD: Nguyễn Văn Linh"
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => void tim()}
          disabled={dangTim}
          className="h-12 rounded-xl bg-cvr-ink px-6 text-[15px] font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
        >
          {dangTim ? "Đang tra…" : "Tra cứu"}
        </button>
      </div>

      {ds !== null && ds.length === 0 && (
        <div className="rounded-xl bg-cvr-surface px-5 py-4 text-[13px] leading-relaxed text-cvr-muted">
          Không tìm thấy tuyến đường nào khớp{tuKhoa.trim() ? ` với “${tuKhoa.trim()}”` : ""}. Thử
          gõ ngắn hơn, chỉ một hai chữ trong tên đường.
        </div>
      )}

      {ds !== null && ds.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-cvr-line bg-white">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-cvr-surface text-[12.5px] text-cvr-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Tuyến đường</th>
                  <th className="px-4 py-3 font-medium">Đoạn</th>
                  <th className="px-4 py-3 font-medium">Vị trí</th>
                  <th className="px-4 py-3 text-right font-medium">Giá mỗi m²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cvr-line">
                {ds.map((d, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-cvr-ink">{d.duong}</span>
                      {d.phuong && <span className="block text-[12.5px] text-cvr-faint">{d.phuong}</span>}
                    </td>
                    <td className="px-4 py-3 text-cvr-body">{d.doan || "Toàn tuyến"}</td>
                    <td className="px-4 py-3 text-cvr-body">
                      {d.vi_tri === 1 ? "Mặt tiền" : `Vị trí ${d.vi_tri}`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-cvr-ink">
                      {vndM2(d.gia_m2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] leading-relaxed text-cvr-faint">
            Căn cứ: {[...new Set(ds.map((d) => d.can_cu).filter(Boolean))].join(" · ")}. Đây là giá
            do Nhà nước ban hành, dùng để tính thuế trước bạ và phí công chứng — không phải giá thị
            trường.
          </p>
        </>
      )}
    </div>
  );
}

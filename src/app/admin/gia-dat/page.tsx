"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ════════════════════════════════════════════════════════════════════════════
// NHẬP BẢNG GIÁ ĐẤT NHÀ NƯỚC TỪ TỆP CSV.
//
// Đây là văn bản pháp quy công khai, chép lại đúng số trong quyết định — không
// có gì để duyệt, nên tải tệp lên là vào thẳng kho và hiện luôn ngoài web.
// Việc kiểm tra nằm ở bước xem trước: dòng nào sai định dạng thì báo đỏ, sửa
// trong Excel rồi tải lại. Dòng sai KHÔNG được lưu.
//
// Mẫu tệp: /mau-gia-dat-nha-nuoc.csv — hướng dẫn: docs/HUONG-DAN-NHAP-GIA-DAT.md
// ════════════════════════════════════════════════════════════════════════════

type Dong = {
  tinh: string;
  phuong: string;
  duong: string;
  doan: string;
  vi_tri: number;
  gia_m2: number;
  can_cu: string;
  hieu_luc_tu: string | null;
  loi?: string;
};

const COT = ["tinh", "phuong", "duong", "doan", "vi_tri", "gia_m2_trieu", "can_cu", "hieu_luc_tu"];

/** Tách một dòng CSV, hiểu cả ô bọc trong dấu ngoặc kép có chứa dấu phẩy. */
function tachDong(s: string): string[] {
  const ra: string[] = [];
  let o = "";
  let trongNgoac = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (trongNgoac && s[i + 1] === '"') {
        o += '"';
        i++;
      } else trongNgoac = !trongNgoac;
    } else if (c === "," && !trongNgoac) {
      ra.push(o.trim());
      o = "";
    } else o += c;
  }
  ra.push(o.trim());
  return ra;
}

function docCsv(text: string): Dong[] {
  const dong = text.split(/\r?\n/).filter((d) => d.trim());
  if (!dong.length) return [];

  const dau = tachDong(dong[0]).map((x) => x.toLowerCase().replace(/^﻿/, ""));
  const viTriCot = COT.map((c) => dau.indexOf(c));

  return dong.slice(1).map((d) => {
    const o = tachDong(d);
    const lay = (i: number) => (viTriCot[i] >= 0 ? (o[viTriCot[i]] ?? "").trim() : "");

    const tinh = lay(0);
    const duong = lay(2);
    const viTri = parseInt(lay(4) || "1", 10);
    // Giá ghi bằng TRIỆU đồng, chấp nhận cả dấu chấm lẫn dấu phẩy thập phân.
    const giaTrieu = parseFloat(lay(5).replace(/\s/g, "").replace(",", "."));
    const canCu = lay(6);
    const ngay = lay(7);

    const r: Dong = {
      tinh,
      phuong: lay(1),
      duong,
      doan: lay(3) || "Toàn tuyến",
      vi_tri: Number.isFinite(viTri) && viTri >= 1 && viTri <= 6 ? viTri : 1,
      gia_m2: Number.isFinite(giaTrieu) ? Math.round(giaTrieu * 1_000_000) : 0,
      can_cu: canCu,
      hieu_luc_tu: /^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngay : null,
    };

    if (!r.tinh) r.loi = "thiếu cột tinh";
    else if (!r.duong) r.loi = "thiếu cột duong";
    else if (!r.gia_m2) r.loi = "giá không đọc được (ghi bằng triệu, VD 32.5)";
    else if (r.gia_m2 > 5_000_000_000) r.loi = "giá quá lớn — có phải đang ghi bằng đồng?";
    else if (!r.can_cu) r.loi = "thiếu số quyết định (cột can_cu)";
    return r;
  });
}

export default function GiaDatPage() {
  const [ds, setDs] = useState<Dong[]>([]);
  const [tenFile, setTenFile] = useState("");
  const [msg, setMsg] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [daCo, setDaCo] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const demKho = async () => {
    const { count } = await createClient()
      .from("gia_dat_nha_nuoc")
      .select("id", { count: "exact", head: true });
    setDaCo(count ?? null);
  };
  useEffect(() => {
    void demKho();
  }, []);

  async function chonFile(f: File) {
    setMsg("");
    setTenFile(f.name);
    setDs(docCsv(await f.text()));
  }

  const dung = ds.filter((d) => !d.loi);
  const sai = ds.filter((d) => d.loi);

  async function luu() {
    if (!dung.length) return;
    setDangLuu(true);
    setMsg("");
    const supabase = createClient();
    let xong = 0;
    for (let i = 0; i < dung.length; i += 500) {
      const lo = dung.slice(i, i + 500).map(({ loi, ...r }) => {
        void loi;
        return r;
      });
      const { error } = await supabase
        .from("gia_dat_nha_nuoc")
        .upsert(lo, { onConflict: "tinh,phuong,duong,doan,vi_tri" });
      if (error) {
        setDangLuu(false);
        setMsg(`Lỗi khi lưu: ${error.message}`);
        return;
      }
      xong += lo.length;
    }
    setDangLuu(false);
    setMsg(`Đã lưu ${xong} dòng — web hiện ngay, không cần duyệt.`);
    setDs([]);
    setTenFile("");
    if (fileRef.current) fileRef.current.value = "";
    void demKho();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Bảng giá đất Nhà nước</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Chép lại số trong quyết định của UBND tỉnh. Tải tệp lên là vào thẳng kho và hiện ngay
          ngoài web — không qua bước duyệt.
        </p>
      </div>

      <div className="rounded-2xl border border-cvr-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/mau-gia-dat-nha-nuoc.csv"
            download
            className="rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body transition hover:border-cvr-ink hover:text-cvr-ink"
          >
            Tải tệp mẫu
          </a>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90">
            Chọn tệp CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void chonFile(f);
              }}
              className="sr-only"
            />
          </label>
          {daCo !== null && (
            <span className="text-[13px] text-cvr-muted">
              Kho đang có <strong className="font-semibold text-cvr-ink">{daCo}</strong> dòng
            </span>
          )}
        </div>
        {tenFile && <p className="mt-2 break-all text-xs text-cvr-muted">Đang xem: {tenFile}</p>}
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

      {ds.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-cvr-body">
              Đọc được <strong className="font-semibold text-cvr-ink">{dung.length}</strong> dòng hợp lệ
              {sai.length > 0 && (
                <>
                  {" "}
                  · <strong className="font-semibold text-red-600">{sai.length}</strong> dòng sai sẽ bỏ qua
                </>
              )}
            </span>
            <button
              type="button"
              onClick={luu}
              disabled={dangLuu || !dung.length}
              className="rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-60"
            >
              {dangLuu ? "Đang lưu…" : `Lưu ${dung.length} dòng vào kho`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cvr-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-cvr-line text-left text-xs uppercase tracking-wider text-cvr-faint">
                    <th className="px-3 py-2.5 font-medium">Tỉnh / Phường</th>
                    <th className="px-3 py-2.5 font-medium">Đường · đoạn</th>
                    <th className="px-3 py-2.5 font-medium">Vị trí</th>
                    <th className="px-3 py-2.5 font-medium">Giá mỗi m²</th>
                    <th className="px-3 py-2.5 font-medium">Căn cứ</th>
                  </tr>
                </thead>
                <tbody>
                  {ds.slice(0, 200).map((d, i) => (
                    <tr
                      key={i}
                      className={`border-b border-cvr-line/70 last:border-0 ${d.loi ? "bg-red-50" : ""}`}
                    >
                      <td className="px-3 py-2.5 text-cvr-body">
                        {d.tinh}
                        {d.phuong ? ` · ${d.phuong}` : ""}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-medium text-cvr-ink">{d.duong}</span>
                        <span className="block text-xs text-cvr-muted">{d.doan}</span>
                      </td>
                      <td className="px-3 py-2.5 text-cvr-body">VT{d.vi_tri}</td>
                      <td className="px-3 py-2.5 font-semibold text-cvr-ink">
                        {d.gia_m2 ? `${(d.gia_m2 / 1_000_000).toFixed(1).replace(".", ",")} tr` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-cvr-muted">
                        {d.loi ? <span className="font-semibold text-red-600">{d.loi}</span> : d.can_cu}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ds.length > 200 && (
              <p className="border-t border-cvr-line px-3 py-2 text-xs text-cvr-muted">
                Đang xem 200 dòng đầu — bấm Lưu vẫn lưu đủ {ds.length} dòng.
              </p>
            )}
          </div>
        </>
      )}

      <div className="rounded-2xl bg-cvr-surface p-4 text-[13px] leading-relaxed text-cvr-muted">
        <p className="font-semibold text-cvr-ink">Quy tắc bắt buộc khi điền tệp</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>
            Giá ghi bằng <strong>triệu đồng</strong>: <code>32.5</code> nghĩa là 32,5 triệu/m².
          </li>
          <li>
            Tên tỉnh theo <strong>hệ mới</strong>: Quảng Nam nay là <code>Đà Nẵng</code>, Thừa Thiên
            Huế nay là <code>Huế</code>.
          </li>
          <li>Mỗi vị trí một dòng — một đoạn có 4 vị trí thì 4 dòng.</li>
          <li>Chép đúng số trong quyết định, không tự ước lượng đoạn không có trong văn bản.</li>
        </ul>
        <p className="mt-2">
          Hướng dẫn đầy đủ cho người nhập: <code>docs/HUONG-DAN-NHAP-GIA-DAT.md</code>
        </p>
      </div>
    </div>
  );
}

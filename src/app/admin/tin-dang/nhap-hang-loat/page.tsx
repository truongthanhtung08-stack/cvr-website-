"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { docTinTuCsv, LOAI_HINH_HOP_LE, type ParsedRow } from "@/lib/csvTin";

// ============================================================================
// ADMIN — ĐĂNG NHIỀU TIN CÙNG LÚC BẰNG FILE (Excel/CSV)
//   B1. Tải file mẫu → điền mỗi dòng một tin
//   B2. Chọn file ở đây → hệ thống kiểm tra từng dòng, báo dòng nào sai
//   B3. Bấm "Đăng N tin" → tin lên web ngay (≤60 giây)
// ============================================================================

export default function NhapHangLoatPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [tenFile, setTenFile] = useState("");
  const [loiChung, setLoiChung] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState("");

  const hopLe = rows.filter((r) => r.loi.length === 0);
  const sai = rows.filter((r) => r.loi.length > 0);

  async function chonFile(file: File) {
    setKetQua("");
    setLoiChung("");
    setRows([]);
    setTenFile(file.name);
    const text = await file.text();
    const { rows: r, loiChung: err } = docTinTuCsv(text);
    if (err) setLoiChung(err);
    setRows(r);
  }

  async function dangTat() {
    if (!hopLe.length) return;
    setDangGui(true);
    setKetQua("");
    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      let xong = 0;
      // Chia lô 50 tin/lần cho nhẹ đường truyền và dễ biết dừng ở đâu nếu lỗi
      for (let i = 0; i < hopLe.length; i += 50) {
        const lo = hopLe.slice(i, i + 50).map((r) => ({ ...r.payload, published_at: now }));
        const { error } = await supabase.from("listings").insert(lo);
        if (error) {
          setKetQua(`Đã đăng ${xong} tin thì gặp lỗi: ${error.message}`);
          setDangGui(false);
          return;
        }
        xong += lo.length;
      }
      setKetQua(`Đã đăng ${xong} tin. Web cập nhật trong vòng 60 giây.`);
      setRows([]);
      setTenFile("");
    } catch {
      setKetQua("Không kết nối được cơ sở dữ liệu.");
    }
    setDangGui(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-cvr-ink">Đăng nhiều tin bằng file</h1>
        <p className="mt-1 text-sm text-cvr-muted">
          Điền tin vào file mẫu (mỗi dòng một tin) rồi tải lên đây — không phải nhập tay từng tin.
        </p>
      </div>

      {/* 3 BƯỚC */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Buoc so="1" title="Tải file mẫu">
          <a
            href="/mau-nhap-tin-hang-loat.csv"
            download
            className="mt-2 inline-flex rounded-lg bg-cvr-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Tải file mẫu (.csv)
          </a>
          <p className="mt-2 text-xs text-cvr-muted">
            Mở bằng Excel / Google Sheet. Giữ nguyên dòng tiêu đề, điền từ dòng 2 trở xuống.
          </p>
        </Buoc>
        <Buoc so="2" title="Lưu lại đúng định dạng">
          <p className="mt-2 text-xs text-cvr-muted">
            Excel: <strong>File → Save As → CSV UTF-8 (Comma delimited)</strong>.
            <br />
            Google Sheet: <strong>File → Tải xuống → CSV</strong>.
          </p>
        </Buoc>
        <Buoc so="3" title="Chọn file & đăng">
          <label className="mt-2 inline-flex cursor-pointer rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">
            Chọn file CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) chonFile(f); e.target.value = ""; }}
            />
          </label>
          {tenFile && <p className="mt-2 truncate text-xs text-cvr-muted">Đang xem: {tenFile}</p>}
        </Buoc>
      </div>

      {loiChung && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loiChung}</p>}
      {ketQua && (
        <p className={`rounded-lg px-4 py-2.5 text-sm ${ketQua.startsWith("Đã đăng") && !ketQua.includes("lỗi") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {ketQua}
        </p>
      )}

      {/* KẾT QUẢ ĐỌC FILE */}
      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cvr-line bg-white px-4 py-3">
            <span className="text-sm text-cvr-body">
              Đọc được <strong className="text-cvr-ink">{rows.length}</strong> dòng ·{" "}
              <span className="text-green-700">{hopLe.length} tin hợp lệ</span>
              {sai.length > 0 && <span className="text-red-700"> · {sai.length} dòng lỗi (sẽ bỏ qua)</span>}
            </span>
            <button
              type="button"
              onClick={dangTat}
              disabled={dangGui || hopLe.length === 0}
              className="ml-auto rounded-lg bg-cvr-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cvr-ink/90 disabled:opacity-50"
            >
              {dangGui ? "Đang đăng…" : `Đăng ${hopLe.length} tin`}
            </button>
          </div>

          {sai.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Các dòng cần sửa trong file:</p>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {sai.map((r) => (
                  <li key={r.dong}>
                    Dòng {r.dong}: {r.loi.join(" · ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-cvr-line bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-cvr-line bg-cvr-surface text-xs uppercase tracking-wide text-cvr-muted">
                <tr>
                  <th className="px-3 py-2.5">Dòng</th>
                  <th className="px-3 py-2.5">Tiêu đề</th>
                  <th className="px-3 py-2.5">Mục đích</th>
                  <th className="px-3 py-2.5">Loại hình</th>
                  <th className="px-3 py-2.5">Giá</th>
                  <th className="px-3 py-2.5">Khu vực</th>
                  <th className="px-3 py-2.5">Hạng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.dong} className={`border-b border-cvr-line/60 ${r.loi.length ? "bg-red-50/60" : ""}`}>
                    <td className="px-3 py-2.5 text-cvr-muted">{r.dong}</td>
                    <td className="max-w-[280px] truncate px-3 py-2.5 font-medium text-cvr-ink">{r.tomTat.tieuDe}</td>
                    <td className="px-3 py-2.5 text-cvr-body">{r.tomTat.mucDich}</td>
                    <td className="px-3 py-2.5 text-cvr-body">{r.tomTat.loaiHinh}</td>
                    <td className="px-3 py-2.5 text-cvr-body">{r.tomTat.gia}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-cvr-body">{r.tomTat.khuVuc}</td>
                    <td className="px-3 py-2.5 uppercase text-cvr-muted">{r.tomTat.hang}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CÁCH ĐIỀN */}
      <section className="rounded-xl border border-cvr-line bg-white p-5">
        <h2 className="text-base font-semibold text-cvr-ink">Cách điền từng cột</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-cvr-body">
          <li><strong>muc_dich</strong>: <code>ban</code> hoặc <code>thue</code>.</li>
          <li><strong>loai_hinh</strong>: chép đúng một tên trong danh sách bên dưới.</li>
          <li><strong>tieu_de</strong>: bắt buộc.</li>
          <li><strong>gia</strong>: tin bán ghi theo <strong>TỶ</strong> (7,2 = 7,2 tỷ) · tin thuê ghi theo <strong>TRIỆU/tháng</strong> (18 = 18 triệu). Bỏ trống = Thỏa thuận.</li>
          <li><strong>dien_tich</strong> (m²), <strong>phong_ngu</strong>, <strong>phong_tam</strong>: chỉ ghi số.</li>
          <li><strong>tinh_thanh</strong>: bắt buộc · <strong>quan_huyen</strong>, <strong>phuong_xa</strong>: nên có để lọc theo khu vực.</li>
          <li><strong>hang_tin</strong>: <code>diamond</code> · <code>gold</code> · <code>silver</code> · <code>basic</code> (bỏ trống = basic).</li>
          <li><strong>anh</strong>: nhiều ảnh ngăn nhau bằng dấu <code>|</code>. Ảnh phải là đường dẫn đã có trên web (vd <code>/images/tin/1.jpg</code>) hoặc link ảnh đầy đủ (https://…).</li>
          <li><strong>dia_chi</strong>, <strong>phap_ly</strong>, <strong>huong</strong>, <strong>lien_he_ten</strong>, <strong>lien_he_sdt</strong>: không bắt buộc.</li>
        </ul>
        <p className="mt-3 text-sm text-cvr-muted">
          Tin nhập bằng file được đăng công khai ngay như khi bấm “Đăng tin”. Sửa lại từng tin ở{" "}
          <Link href="/admin/tin-dang" className="font-medium text-cvr-blue-ink underline">Tin đăng</Link>.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DanhSachLoai title="loai_hinh khi muc_dich = ban" items={LOAI_HINH_HOP_LE.ban} />
          <DanhSachLoai title="loai_hinh khi muc_dich = thue" items={LOAI_HINH_HOP_LE.thue} />
        </div>
      </section>
    </div>
  );
}

function Buoc({ so, title, children }: { so: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cvr-line bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cvr-faint">Bước {so}</p>
      <p className="mt-1 text-sm font-semibold text-cvr-ink">{title}</p>
      {children}
    </div>
  );
}

function DanhSachLoai({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-cvr-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-cvr-muted">{title}</p>
      <ul className="mt-1.5 space-y-0.5 text-sm text-cvr-body">
        {items.map((x) => <li key={x}>· {x}</li>)}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  anhThuocMa,
  cungTenTep,
  docTinTuBang,
  docTinTuCsv,
  laLinkAnh,
  LOAI_HINH_HOP_LE,
  type ParsedRow,
} from "@/lib/csvTin";
import { docXlsx } from "@/lib/docXlsx";
import { uploadImageFile } from "@/lib/uploadImage";
import { soAnhToiDa } from "@/lib/billing";
import { useBilling } from "@/lib/useBilling";
import type { TierId } from "@/lib/packages";

// ============================================================================
// ADMIN — ĐĂNG NHIỀU TIN CÙNG LÚC BẰNG FILE (Excel/CSV)
//   B1. Tải file mẫu → điền mỗi dòng một tin
//   B2. Chọn file ở đây → hệ thống kiểm tra từng dòng, báo dòng nào sai
//   B3. Bấm "Đăng N tin" → tin lên web ngay (≤60 giây)
// ============================================================================

export default function NhapHangLoatPage() {
  const { billing } = useBilling(); // giới hạn ảnh theo cấp tin
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [tenFile, setTenFile] = useState("");
  const [loiChung, setLoiChung] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [ketQua, setKetQua] = useState("");

  // Ảnh tải hàng loạt: tên tệp → link đã tải lên kho ảnh
  const [anhDaTai, setAnhDaTai] = useState<{ ten: string; url: string }[]>([]);
  const [dangTaiAnh, setDangTaiAnh] = useState(0); // số ảnh còn lại đang tải
  const [loiAnh, setLoiAnh] = useState("");

  const sai = rows.filter((r) => r.loi.length > 0);

  // ẢNH CỦA MỘT TIN — gộp 2 cách, giữ đúng thứ tự anh ghi trong file:
  //   1) Cột "anh" ghi TÊN TỆP ảnh trên máy → lấy link của ảnh đã tải cùng tên
  //      (ghi thiếu đuôi .jpg cũng khớp). Ghi sẵn link/đường dẫn thì dùng thẳng.
  //   2) Cột "ma_anh" → tự gom mọi ảnh tải lên có tên bắt đầu bằng mã đó,
  //      xếp theo SỐ cuối tên tệp nên ảnh …-1 làm ẢNH ĐẠI DIỆN.
  const anhCuaTin = (r: ParsedRow): { urls: string[]; thieu: string[]; boBot: number; toiDa: number } => {
    const urls: string[] = [];
    const thieu: string[] = [];

    for (const gt of (r.payload.images as string[]) ?? []) {
      if (laLinkAnh(gt)) { urls.push(gt); continue; }
      const tim = anhDaTai.find((a) => cungTenTep(a.ten, gt));
      if (tim) urls.push(tim.url);
      else thieu.push(gt);
    }

    const theoMa = anhDaTai
      .filter((a) => anhThuocMa(a.ten, r.maAnh))
      .sort((a, b) => soCuoiTen(a.ten) - soCuoiTen(b.ten) || a.ten.localeCompare(b.ten, "vi", { numeric: true }))
      .map((a) => a.url)
      .filter((u) => !urls.includes(u)); // đã lấy theo tên tệp thì không lấy lại

    // GIỚI HẠN ẢNH THEO CẤP TIN (Basic 7 · Silver 10 · Gold 12 · Diamond 15)
    const tier = (r.payload.tier as TierId) ?? "basic";
    const toiDa = soAnhToiDa(billing, tier);
    const tatCa = [...urls, ...theoMa];
    return { urls: tatCa.slice(0, toiDa), thieu, boBot: Math.max(0, tatCa.length - toiDa), toiDa };
  };

  // ĐÚNG LUẬT nhưng CHƯA có ảnh thật (mới ghi ma_anh, chưa tải ảnh ở Bước 4)
  // thì chưa đăng được — đếm riêng để báo rõ, không lặng lẽ bỏ qua.
  const dungLuat = rows.filter((r) => r.loi.length === 0);
  const chuaAnh = dungLuat.filter((r) => anhCuaTin(r).urls.length === 0);
  const hopLe = dungLuat.filter((r) => anhCuaTin(r).urls.length > 0);

  async function taiAnhHangLoat(files: FileList) {
    setLoiAnh("");
    const ds = Array.from(files);
    setDangTaiAnh(ds.length);
    const them: { ten: string; url: string }[] = [];
    for (const f of ds) {
      const { url, error } = await uploadImageFile(f);
      if (error) setLoiAnh(error);
      else if (url) them.push({ ten: f.name, url });
      setDangTaiAnh((n) => n - 1);
    }
    setAnhDaTai((cu) => [...cu, ...them]);
    setDangTaiAnh(0);
  }

  // Nhận cả Excel (.xlsx) và CSV — Excel đọc thẳng, không cần "Save as CSV"
  // (Excel lưu CSV hay sai bảng mã làm tiếng Việt vỡ dấu).
  async function chonFile(file: File) {
    setKetQua("");
    setLoiChung("");
    setRows([]);
    setTenFile(file.name);
    try {
      const laExcel = /\.xlsx$/i.test(file.name);
      const { rows: r, loiChung: err } = laExcel
        ? docTinTuBang(await docXlsx(await file.arrayBuffer()))
        : docTinTuCsv(await file.text());
      if (err) setLoiChung(err);
      setRows(r);
    } catch (e) {
      setLoiChung(
        /\.xls$/i.test(file.name)
          ? "File .xls đời cũ chưa đọc được — mở bằng Excel rồi Lưu thành .xlsx."
          : `Không đọc được file: ${e instanceof Error ? e.message : "lỗi không rõ"}`,
      );
    }
  }

  async function dangTat() {
    if (!hopLe.length) return;
    setDangGui(true);
    setKetQua("");
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // ĐÃ ĐĂNG RỒI THÌ CHỈ BỔ SUNG ẢNH, KHÔNG ĐĂNG TRÙNG.
      // Ảnh thường về từng đợt (xin được tin nào bỏ tin đó), nên chủ dự án hay
      // phải tải cùng một file nhiều lần. Đối chiếu bằng mã ảnh đã lưu trong tin.
      const maTrongFile = [...new Set(hopLe.map((r) => r.maAnh).filter(Boolean))];
      const daCo = new Map<string, { id: string; images: string[] }>();
      if (maTrongFile.length) {
        const { data } = await supabase
          .from("listings")
          .select("id,images,details->>maAnh")
          .in("details->>maAnh", maTrongFile);
        for (const r of (data ?? []) as { id: string; images: string[] | null; maAnh: string }[])
          if (r.maAnh) daCo.set(r.maAnh, { id: r.id, images: r.images ?? [] });
      }

      const tinMoi = hopLe.filter((r) => !r.maAnh || !daCo.has(r.maAnh));
      const tinCu = hopLe.filter((r) => r.maAnh && daCo.has(r.maAnh));

      let xong = 0;
      // Chia lô 50 tin/lần cho nhẹ đường truyền và dễ biết dừng ở đâu nếu lỗi
      for (let i = 0; i < tinMoi.length; i += 50) {
        const lo = tinMoi
          .slice(i, i + 50)
          .map((r) => ({ ...r.payload, images: anhCuaTin(r).urls, published_at: now }));
        const { error } = await supabase.from("listings").insert(lo);
        if (error) {
          setKetQua(`Đã đăng ${xong} tin thì gặp lỗi: ${error.message}`);
          setDangGui(false);
          return;
        }
        xong += lo.length;
      }

      // Tin cũ: gộp ảnh mới vào sau ảnh đã có, bỏ ảnh trùng, cắt theo hạng tin
      let capNhat = 0;
      for (const r of tinCu) {
        const cu = daCo.get(r.maAnh)!;
        const { urls, toiDa } = anhCuaTin(r);
        const gop = [...cu.images, ...urls.filter((u) => !cu.images.includes(u))].slice(0, toiDa);
        if (gop.length === cu.images.length) continue; // không có ảnh nào mới
        const { error } = await supabase.from("listings").update({ images: gop }).eq("id", cu.id);
        if (error) {
          setKetQua(`Đã đăng ${xong} tin, cập nhật ${capNhat} tin thì gặp lỗi: ${error.message}`);
          setDangGui(false);
          return;
        }
        capNhat++;
      }

      setKetQua(
        `Đã đăng ${xong} tin mới` +
          (capNhat ? ` · bổ sung ảnh cho ${capNhat} tin đã đăng` : "") +
          (tinCu.length - capNhat ? ` · ${tinCu.length - capNhat} tin đã đăng, không có ảnh mới` : "") +
          ". Web cập nhật trong vòng 60 giây.",
      );
      setRows([]);
      setTenFile("");
      setAnhDaTai([]);
    } catch {
      setKetQua("Không kết nối được cơ sở dữ liệu.");
    }
    setDangGui(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-cvr-ink">Đăng nhiều tin bằng file</h1>
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
        <Buoc so="2" title="Soạn bằng Excel, lưu .xlsx">
          <p className="mt-2 text-xs text-cvr-muted">
            Mở file mẫu bằng Excel → điền tin → <strong>File → Save As → Excel Workbook (.xlsx)</strong>.
            Không cần chuyển sang CSV. Giữ .csv cũng được.
          </p>
          <p className="mt-1.5 text-xs text-cvr-muted">
            Cứ tô màu, giãn cột, đổi thứ tự cột, đổi tên cột sang tiếng Việt, thêm cột riêng —
            hệ thống vẫn đọc đúng.
          </p>
        </Buoc>
        <Buoc so="3" title="Chọn file Excel">
          <label className="mt-2 inline-flex cursor-pointer rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">
            Chọn file .xlsx / .csv
            <input
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) chonFile(f); e.target.value = ""; }}
            />
          </label>
          {tenFile && <p className="mt-2 truncate text-xs text-cvr-muted">Đang xem: {tenFile}</p>}
        </Buoc>
      </div>

      {/* BƯỚC 4 — TẢI ẢNH HÀNG LOẠT, TỰ KHỚP VÀO TIN THEO TÊN TỆP */}
      <section className="rounded-xl border border-cvr-line bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-cvr-faint">Bước 4</p>
        <h2 className="mt-1 text-base font-semibold text-cvr-ink">Tải ảnh cho tất cả tin — một lượt</h2>
        <p className="mt-1 text-sm text-cvr-muted">
          Ảnh để trong thư mục trên máy, tên ảnh khớp cột <code>ma_anh</code> trong file Excel.
          Chọn HẾT ảnh một lần — hệ thống tự chia về đúng từng tin, ảnh <strong>-1</strong> làm ảnh đại diện.
          Tin nào thiếu ảnh sẽ bị bôi đỏ trong bảng xem trước.
        </p>
        <p className="mt-1 text-sm text-cvr-muted">
          Mọi ảnh tải lên đều được <strong>tự thu nhỏ + đóng dấu chìm “COASTAL LAND”</strong> ở góc dưới phải.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cvr-line px-4 py-2 text-sm font-medium text-cvr-body hover:border-cvr-ink hover:text-cvr-ink">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Chọn nhiều ảnh từ máy
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { const f = e.target.files; if (f?.length) taiAnhHangLoat(f); e.target.value = ""; }}
            />
          </label>
          {dangTaiAnh > 0 && <span className="text-sm text-cvr-muted">Đang tải… còn {dangTaiAnh} ảnh</span>}
          {anhDaTai.length > 0 && dangTaiAnh === 0 && (
            <span className="text-sm font-medium text-green-700">Đã tải {anhDaTai.length} ảnh</span>
          )}
          {anhDaTai.length > 0 && (
            <button
              type="button"
              onClick={() => setAnhDaTai([])}
              className="text-sm text-cvr-muted underline hover:text-cvr-ink"
            >
              Bỏ hết ảnh đã tải
            </button>
          )}
        </div>
        {loiAnh && <p className="mt-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{loiAnh}</p>}
        <p className="mt-2 text-xs text-cvr-faint">
          Ảnh ≤ 10MB mỗi tệp. Tin nào đã ghi sẵn link trong cột <code>anh</code> thì link đó đứng trước.
        </p>
      </section>

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
              {chuaAnh.length > 0 && (
                <span className="text-amber-700"> · {chuaAnh.length} tin chưa có ảnh (tải ảnh ở Bước 4 mới đăng được)</span>
              )}
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
            <p className="w-full text-xs text-cvr-muted">
              Tải cùng một file nhiều lần cũng <strong>không bị trùng tin</strong>: tin nào đã đăng rồi
              (khớp theo <code>ma_anh</code>) thì chỉ <strong>bổ sung ảnh mới</strong>, không đăng lại.
              Nhờ vậy xin được ảnh tới đâu cứ bỏ vào thư mục rồi tải lên tới đó.
            </p>
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
                  <th className="px-3 py-2.5">Ảnh</th>
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
                    <td className="px-3 py-2.5">
                      <AnhCell {...anhCuaTin(r)} />
                    </td>
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
          <li><strong>tieu_de</strong>: bắt buộc, <strong>tối thiểu 30 ký tự</strong> — nên có loại hình + tên phường/xã.</li>
          <li><strong>mo_ta</strong>: bắt buộc, <strong>tối thiểu 50 ký tự</strong> (khoảng 1–2 câu).</li>
          <li><strong>gia</strong>: tin bán ghi theo <strong>TỶ</strong> (7,2 = 7,2 tỷ) · tin thuê ghi theo <strong>TRIỆU/tháng</strong> (18 = 18 triệu). Bỏ trống = Thỏa thuận.</li>
          <li><strong>dien_tich</strong> (m²): bắt buộc · <strong>phong_ngu</strong>, <strong>phong_tam</strong>: chỉ ghi số.</li>
          <li>
            <strong>tinh_thanh</strong>, <strong>phuong_xa</strong>: bắt buộc — ghi theo{" "}
            <strong>đơn vị hành chính MỚI 2 cấp</strong> (Tỉnh/Thành → Phường/Xã, không còn Quận/Huyện).
            Ví dụ: <code>Phường Sơn Trà</code> + <code>Đà Nẵng</code> · <code>Phường Quy Nhơn</code> + <code>Gia Lai</code>.
            Cột <code>quan_huyen</code> chỉ dùng cho dữ liệu cũ, để trống cũng được.
          </li>
          <li><strong>hang_tin</strong>: <code>diamond</code> · <code>gold</code> · <code>silver</code> · <code>basic</code> (bỏ trống = basic).</li>
          <li>
            <strong>ma_anh</strong> — cột ảnh duy nhất, ghi theo <strong>một trong hai cách</strong>:
            <br />
            · <strong>Cách gọn (nên dùng)</strong>: ghi mã <code>tin01</code>, rồi đặt tên ảnh trên máy là
            <code> tin01-1.jpg</code>, <code>tin01-2.jpg</code>… — hệ thống tự gom, ảnh <strong>-1</strong> làm ảnh đại diện.
            <br />
            · <strong>Cách liệt kê</strong>: ghi thẳng tên từng ảnh, ngăn nhau bằng <code>|</code> hoặc dấu phẩy —
            vd <code>nha-my-khe-1.jpg | nha-my-khe-2.jpg</code>. Ảnh ghi trước làm ảnh đại diện.
            <br />
            <strong>Bắt buộc ít nhất 1 ảnh</strong> — dòng không ghi mã cũng không ghi tên ảnh sẽ bị báo lỗi.
            Có ghi mã nhưng chưa tải ảnh lên ở Bước 4 thì tin vẫn chưa đăng được, bảng sẽ báo “chưa có ảnh”.
          </li>
          <li><strong>dia_chi</strong>, <strong>phap_ly</strong>, <strong>huong</strong>, <strong>lien_he_ten</strong>, <strong>lien_he_sdt</strong>: không bắt buộc.</li>
          <li>
            <strong>ten_du_an</strong>, <strong>huong_ban_cong</strong>, <strong>tinh_trang_noi_that</strong>,{" "}
            <strong>noi_that_ban_giao</strong>, <strong>tien_ich</strong>: không bắt buộc — hai cột cuối ghi
            nhiều mục ngăn nhau bằng dấu phẩy, vd <code>Máy lạnh, Tủ bếp, Sofa</code>.
          </li>
        </ul>
        <div className="mt-4 rounded-lg bg-cvr-surface p-3 text-sm text-cvr-body">
          <p className="font-semibold text-cvr-ink">Căn chỉnh file cho dễ nhìn — được phép:</p>
          <p className="mt-1">
            Tô màu · in đậm · giãn cột · đóng băng dòng · <strong>đổi thứ tự cột</strong> ·
            <strong> đổi tên cột sang tiếng Việt có dấu</strong> (Tiêu đề, Mục đích, Giá, Tỉnh thành) ·
            thêm cột riêng (STT, ghi chú) · để dòng trống xen giữa ·
            chèn dòng tiêu đề trang trí phía trên.
          </p>
          <p className="mt-2 font-semibold text-cvr-ink">Không được:</p>
          <p className="mt-1">
            Gộp ô (merge) trong vùng dữ liệu · để dữ liệu ở sheet thứ hai ·
            ghi giá kèm chữ (<code>5,5 tỷ</code>) — chỉ ghi số <code>5,5</code>.
          </p>
        </div>

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

// Ô "Ảnh" trong bảng xem trước: có bao nhiêu ảnh · thiếu ảnh nào (theo tên ghi trong file)
function AnhCell({ urls, thieu, boBot, toiDa }: { urls: string[]; thieu: string[]; boBot: number; toiDa: number }) {
  return (
    <div className="min-w-[130px]">
      {urls.length > 0 ? (
        <span className="font-medium text-green-700">{urls.length}/{toiDa} ảnh</span>
      ) : (
        <span className="text-cvr-faint">chưa có</span>
      )}
      {boBot > 0 && (
        <p className="mt-0.5 text-xs font-medium text-amber-700">
          Bỏ bớt {boBot} ảnh (cấp tin này tối đa {toiDa})
        </p>
      )}
      {thieu.length > 0 && (
        <p className="mt-0.5 text-xs font-medium text-red-700">Chưa tải: {thieu.join(", ")}</p>
      )}
    </div>
  );
}

// Số thứ tự ở CUỐI tên tệp: "tin01-2.jpg" → 2 · "tin01 (3).png" → 3 · không có → 9999
function soCuoiTen(ten: string): number {
  const m = ten.replace(/\.[^.]+$/, "").match(/(\d+)\s*\)?$/);
  return m ? Number(m[1]) : 9999;
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
